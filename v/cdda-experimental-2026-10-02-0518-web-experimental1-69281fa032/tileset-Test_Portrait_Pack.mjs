export default async function loadDataFile(Module) {

  if (!Module['expectedDataFileDownloads']) Module['expectedDataFileDownloads'] = 0;
  Module['expectedDataFileDownloads']++;
    // Do not attempt to redownload the virtual filesystem data when in a pthread or a Wasm Worker context.
    var isPthread = typeof ENVIRONMENT_IS_PTHREAD != 'undefined' && ENVIRONMENT_IS_PTHREAD;
    var isWasmWorker = typeof ENVIRONMENT_IS_WASM_WORKER != 'undefined' && ENVIRONMENT_IS_WASM_WORKER;
    if (isPthread || isWasmWorker) return;
return new Promise((loadDataResolve, loadDataReject) => {
    async function loadPackage(metadata) {

      var PACKAGE_PATH = '';
      if (typeof window === 'object') {
        PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/');
      } else if (typeof process === 'undefined' && typeof location !== 'undefined') {
        // web worker
        PACKAGE_PATH = encodeURIComponent(location.pathname.substring(0, location.pathname.lastIndexOf('/')) + '/');
      }
      var PACKAGE_NAME = 'build/tileset-Test_Portrait_Pack.data';
      var REMOTE_PACKAGE_BASE = 'tileset-Test_Portrait_Pack.data';
      var REMOTE_PACKAGE_NAME = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
      var REMOTE_PACKAGE_SIZE = metadata['remote_package_size'];

      async function fetchRemotePackage(packageName, packageSize) {
        
        if (!Module['dataFileDownloads']) Module['dataFileDownloads'] = {};
        try {
          var response = await fetch(packageName);
        } catch (e) {
          throw new Error(`Network Error: ${packageName}`, {e});
        }
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.url}`);
        }

        const chunks = [];
        const headers = response.headers;
        const total = Number(headers.get('Content-Length') || packageSize);
        let loaded = 0;

        Module['setStatus'] && Module['setStatus']('Downloading data...');
        const reader = response.body.getReader();

        while (1) {
          var {done, value} = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          Module['dataFileDownloads'][packageName] = {loaded, total};

          let totalLoaded = 0;
          let totalSize = 0;

          for (const download of Object.values(Module['dataFileDownloads'])) {
            totalLoaded += download.loaded;
            totalSize += download.total;
          }

          Module['setStatus'] && Module['setStatus'](`Downloading data... (${totalLoaded}/${totalSize})`);
        }

        const packageData = new Uint8Array(chunks.map((c) => c.length).reduce((a, b) => a + b, 0));
        let offset = 0;
        for (const chunk of chunks) {
          packageData.set(chunk, offset);
          offset += chunk.length;
        }
        return packageData.buffer;
      }

      var fetchPromise;
      var fetched = Module['getPreloadedPackage'] && Module['getPreloadedPackage'](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);

      if (!fetched) {
        // Note that we don't use await here because we want to execute the
        // the rest of this function immediately.
        fetchPromise = fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE)
        .catch((error) => {
          loadDataReject(error);
        });
      }

    async function runWithFS(Module) {

      function assert(check, msg) {
        if (!check) throw new Error(msg);
      }
Module['FS_createPath']("/", "gfx", true, true);
Module['FS_createPath']("/gfx", "Test_Portrait_Pack", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        var compressedData = {"data":null,"cachedOffset":23043,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,1992,3929,5949,7932,9860,11826,13861,15825,17799,19666,21708,22915],"sizes":[1992,1937,2020,1983,1928,1966,2035,1964,1974,1867,2042,1207,128],"successes":[1,1,1,1,1,1,1,1,1,1,1,1,1]}
;
            compressedData['data'] = byteArray;
            assert(typeof Module['LZ4'] === 'object', 'LZ4 not present - was your app build with -sLZ4?');
            await Module['LZ4'].loadPackage({ 'metadata': metadata, 'compressedData': compressedData }, false);
            Module['removeRunDependency']('datafile_build/tileset-Test_Portrait_Pack.data');
loadDataResolve();
      }
      Module['addRunDependency']('datafile_build/tileset-Test_Portrait_Pack.data');

      if (!Module['preloadResults']) Module['preloadResults'] = {};

      Module['preloadResults'][PACKAGE_NAME] = {fromCache: false};
      if (!fetched) {
        fetched = await fetchPromise;
      }
      await processPackageData(fetched);

    }
    // Detect whether the module JS file has already been loaded.
    if (Module['FS_createPath']) {
      runWithFS(Module)
        .catch((error) => {
          loadDataReject(error);
        });
    } else {
      if (!Module['preRun']) Module['preRun'] = [];
      Module['preRun'].push(runWithFS); // FS is not initialized yet, wait for it
    }

    }
    loadPackage({"files": [{"filename": "/gfx/Test_Portrait_Pack/GENERIC_FEMALE_PORTRAIT_001.png", "start": 0, "end": 2204}, {"filename": "/gfx/Test_Portrait_Pack/GENERIC_FEMALE_PORTRAIT_002.png", "start": 2204, "end": 4657}, {"filename": "/gfx/Test_Portrait_Pack/GENERIC_FEMALE_PORTRAIT_003.png", "start": 4657, "end": 7113}, {"filename": "/gfx/Test_Portrait_Pack/GENERIC_MALE_PORTRAIT_001.png", "start": 7113, "end": 9215}, {"filename": "/gfx/Test_Portrait_Pack/GENERIC_MALE_PORTRAIT_002.png", "start": 9215, "end": 11635}, {"filename": "/gfx/Test_Portrait_Pack/GENERIC_MALE_PORTRAIT_003.png", "start": 11635, "end": 14161}, {"filename": "/gfx/Test_Portrait_Pack/Monster_Talk_Civilian.png", "start": 14161, "end": 17508}, {"filename": "/gfx/Test_Portrait_Pack/Named_NPC_Smokes.png", "start": 17508, "end": 19978}, {"filename": "/gfx/Test_Portrait_Pack/Named_NPC_Smokes_TOPIC.png", "start": 19978, "end": 23172}, {"filename": "/gfx/Test_Portrait_Pack/README.txt", "start": 23172, "end": 23379}, {"filename": "/gfx/Test_Portrait_Pack/tile_config.json", "start": 23379, "end": 24753}], "remote_package_size": 27139});

  });
}
// END the loadDataFile function
