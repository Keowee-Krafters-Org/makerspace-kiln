# Kiln Controller (Raspberry Pi)

This project contains the software for the Raspberry Pi that controls the kiln. It consists of a Node.js service that communicates with the Arduino controller and a web-based client for user interaction.

## Project Structure

This is a monorepo using npm workspaces.

-   `service/`: The Node.js backend service that interfaces with the kiln hardware.
-   `client/`: A web-based frontend application for monitoring and controlling the kiln.
-   `deploy.js`: A script to build and deploy the service and client to the Raspberry Pi.

## Local Development

### Prerequisites

-   Node.js and npm

### Setup

1.  **Install Dependencies:**
    From the `pi` directory, install dependencies for both the service and client:
    ```bash
    npm install
    ```

2.  **Run Development Servers:**
    -   To run the service:
        ```bash
        npm start -w service
        ```
    -   To run the client development server:
        ```bash
        npm run dev -w client
        ```

## Building for Production

To build both the client and service for production, run the following command from the `pi` directory:

```bash
npm run build
```

This will create optimized builds in the `client/dist` and `service/build` directories.

## Deployment

The `deploy.js` script automates the process of deploying the application to the Raspberry Pi.

### Deployment Configuration

Before deploying, you may need to edit the configuration at the top of `deploy.js`:

```javascript
const CONFIG = {
    piUser: 'csmith',
    piHost: '10.10.10.109', // Update this
    piTargetDir: '/opt/makerspace-kiln',
    packageName: 'kiln-release.tar.gz'
};
```

-   `piUser`: The username for SSH access to the Pi.
-   `piHost`: The IP address or hostname of the Pi.
-   `piTargetDir`: The directory on the Pi where the application will be installed.

### Running the Deployment

To deploy the application, run the following command from the `pi` directory:

```bash
npm run deploy
```

The deployment script performs the following steps:
1.  Builds the client and service.
2.  Packages the production assets into a `tar.gz` archive.
3.  Uploads the archive to the Raspberry Pi using `scp`.
4.  Executes a remote command via `ssh` to:
    -   Extract the archive to the target directory.
    -   Set file permissions.
    -   Install production dependencies (`npm install --omit=dev`).
    -   Restart the `kiln-controller` systemd service.

