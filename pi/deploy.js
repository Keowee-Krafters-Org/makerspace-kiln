const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const CONFIG = {
    piUser: 'csmith',
    piHost: '10.10.10.109', // Update this
    piTargetDir: '/opt/makerspace-kiln',
    packageName: 'kiln-release.tar.gz'
};

const DIRS = {
    root: __dirname,
    client: path.join(__dirname, 'client'),
    service: path.join(__dirname, 'service'),
    stage: path.join(__dirname, 'stage') // Temporary staging area
};

// --- Helpers ---
function run(cmd, cwd) {
    console.log(`> ${cmd}`);
    execSync(cmd, { cwd: cwd || DIRS.root, stdio: 'inherit' });
}

try {
    console.log('🔥 STARTING KILN DEPLOYMENT 🔥');

    // 1. Bump Version
    console.log('\n📝 Bumping package version...');
    run('npm version patch --no-git-tag-version');
    const { version } = require('./package.json');
    console.log(`  New version: ${version}`);

    // 2. Clean Staging
    if (fs.existsSync(DIRS.stage)) fs.rmSync(DIRS.stage, { recursive: true });
    fs.mkdirSync(DIRS.stage);

    // 3. Build Client
    console.log('\n📦 Building Frontend...');
    run('npm install', DIRS.client);
    // Pass version to the client build
    run(`cross-env VITE_APP_VERSION=${version} npm run build`, DIRS.client);

    // 4. Build Service
    console.log('\n⚙️  Building Service...');
    run('npm install', DIRS.service);
    run('npm run build', DIRS.service); // This runs the simplified vite config

    // 5. Assemble Package in Staging
    console.log('\n🧩 Assembling Package...');
    
    // Copy Service Build (the code)
    fs.cpSync(path.join(DIRS.service, 'build', 'index.js'), path.join(DIRS.stage, 'index.js'));
    
    // Copy Package.json (deps)
    fs.cpSync(path.join(DIRS.service, 'package.json'), path.join(DIRS.stage, 'package.json'));
    
    // Copy Client Build (static files) to public/
    fs.cpSync(path.join(DIRS.client, 'dist'), path.join(DIRS.stage, 'public'), { recursive: true });

    // Copy systemd service file
    fs.cpSync(path.join(DIRS.service, 'kiln-controller.service'), path.join(DIRS.stage, 'kiln-controller.service'));

    // Copy default config
    fs.cpSync(path.join(DIRS.service, 'config.json'), path.join(DIRS.stage, 'config.json'));

    // Copy install script
    fs.cpSync(path.join(__dirname, 'install.sh'), path.join(DIRS.stage, 'install.sh'));


    // 6. Compress
    console.log('\n🗜️  Compressing...');
    run(`tar -czf ${CONFIG.packageName} -C stage .`);

    // 7. Upload
    console.log(`\n🚀 Uploading to ${CONFIG.piHost}...`);
    run(`scp ${CONFIG.packageName} ${CONFIG.piUser}@${CONFIG.piHost}:~/`);
    run(`scp ${path.join(DIRS.stage, 'install.sh')} ${CONFIG.piUser}@${CONFIG.piHost}:~/`);


    // 8. Remote Execute
    console.log(`\n🔌 Executing on Pi...`);
    const remoteCmd = `chmod +x ~/install.sh && sudo ~/install.sh`;
    run(`ssh ${CONFIG.piUser}@${CONFIG.piHost} "${remoteCmd}"`);

    console.log(`\n✅ DEPLOYMENT COMPLETE. Version: ${version}`);

} catch (e) {
    console.error('\n❌ FAILED:', e.message);
    process.exit(1);
}