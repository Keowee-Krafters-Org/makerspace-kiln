function doGet() {
  return HtmlService.createHtmlOutputFromFile('ui/index.html')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
