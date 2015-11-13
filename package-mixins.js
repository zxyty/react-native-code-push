var extend = require("extend");
var { NativeAppEventEmitter } = require('react-native');

module.exports = (NativeCodePush) => {
  var remote = {
    abortDownload: function abortDownload() {
      return NativeCodePush.abortDownload(this);
    },
    download: function download(progressHandler) {
      if (!this.downloadUrl) {
        return Promise.reject(new Error("Cannot download an update without a download url"));
      }
      
      // Use event subscription to obtain download progress.   
      var downloadProgressSubscription = NativeAppEventEmitter.addListener(
        'CodePushDownloadProgress',
        progressHandler
      );
      
      // Use the downloaded package info. Native code will save the package info
      // so that the client knows what the current package version is.
      return NativeCodePush.downloadUpdate(this)
        .then((downloadedPackage) => {
          downloadProgressSubscription.remove();
          return extend({}, downloadedPackage, local);
        })
        .catch((error) => {
          downloadProgressSubscription.remove();
          // Rethrow the error for subsequent handlers down the promise chain.
          throw error;
        });
    }
  };

  var local = {
    apply: function apply(rollbackTimeout = 0, restartImmediately = true) {
      return NativeCodePush.applyUpdate(this, rollbackTimeout, restartImmediately);
    }
  };

  return {
    remote: remote,
    local: local
  };
};