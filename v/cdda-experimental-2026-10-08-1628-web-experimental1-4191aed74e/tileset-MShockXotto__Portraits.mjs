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
      var PACKAGE_NAME = 'build/tileset-MShockXotto__Portraits.data';
      var REMOTE_PACKAGE_BASE = 'tileset-MShockXotto__Portraits.data';
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
Module['FS_createPath']("/gfx", "MShockXotto+_Portraits", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        var compressedData = {"data":null,"cachedOffset":317703,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2057,4112,6158,8202,10244,12292,14342,16395,18368,20416,22464,24512,26562,28593,30641,32689,34737,36701,38752,40800,42848,44896,46932,48981,51035,53088,55133,57100,59148,61196,63244,65290,67334,69373,71421,73469,75509,77503,79551,81599,83647,85699,87727,89775,91829,93884,95843,97891,99939,101987,104034,106078,108120,110175,112226,114274,116246,118294,120342,122390,124441,126474,128522,130578,132626,134629,136666,138714,140762,142810,144843,146892,148948,151001,153053,155015,157063,159111,161166,163216,165262,167302,169350,171397,173447,175410,177458,179506,181554,183603,185636,187684,189732,191780,193753,195801,197849,199897,201945,203976,206025,208082,210135,212188,214144,216192,218240,220288,222338,224385,226425,228473,230525,232579,234544,236592,238640,240688,242741,244770,246818,248871,250919,252893,254929,256977,259025,261073,263109,265157,267205,269260,271310,273260,275308,277356,279404,281451,283498,285537,287585,289634,291685,293670,295718,297766,299814,301863,303899,305947,307995,310043,312013,314057,315773,317328],"sizes":[2057,2055,2046,2044,2042,2048,2050,2053,1973,2048,2048,2048,2050,2031,2048,2048,2048,1964,2051,2048,2048,2048,2036,2049,2054,2053,2045,1967,2048,2048,2048,2046,2044,2039,2048,2048,2040,1994,2048,2048,2048,2052,2028,2048,2054,2055,1959,2048,2048,2048,2047,2044,2042,2055,2051,2048,1972,2048,2048,2048,2051,2033,2048,2056,2048,2003,2037,2048,2048,2048,2033,2049,2056,2053,2052,1962,2048,2048,2055,2050,2046,2040,2048,2047,2050,1963,2048,2048,2048,2049,2033,2048,2048,2048,1973,2048,2048,2048,2048,2031,2049,2057,2053,2053,1956,2048,2048,2048,2050,2047,2040,2048,2052,2054,1965,2048,2048,2048,2053,2029,2048,2053,2048,1974,2036,2048,2048,2048,2036,2048,2048,2055,2050,1950,2048,2048,2048,2047,2047,2039,2048,2049,2051,1985,2048,2048,2048,2049,2036,2048,2048,2048,1970,2044,1716,1555,375],"successes":[1,1,1,1,1,0,1,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,0,0,1,1,0,0,0,1,1,0,1,1,1,0,0,0,1,1,1,1,1,0,1,0,0,0,1,1,0,1,0,1,1,0,0,0,1,1,1,1,1,1,0,0,1,1,1,1,0,1,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,0,1,1,1,0,0,0,1,1,0,1,0,1,1,0,0,0,1,1,0,1,1,1,0,0,0,1,1,1,0,1,1,1,0,0,0,1,1,0,0,0,1,1,1,1,1]}
;
            compressedData['data'] = byteArray;
            assert(typeof Module['LZ4'] === 'object', 'LZ4 not present - was your app build with -sLZ4?');
            await Module['LZ4'].loadPackage({ 'metadata': metadata, 'compressedData': compressedData }, false);
            Module['removeRunDependency']('datafile_build/tileset-MShockXotto__Portraits.data');
loadDataResolve();
      }
      Module['addRunDependency']('datafile_build/tileset-MShockXotto__Portraits.data');

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
    loadPackage({"files": [{"filename": "/gfx/MShockXotto+_Portraits/fallback.png", "start": 0, "end": 316141}, {"filename": "/gfx/MShockXotto+_Portraits/portraits.png", "start": 316141, "end": 319025}, {"filename": "/gfx/MShockXotto+_Portraits/tile_config.json", "start": 319025, "end": 320597}], "remote_package_size": 321799});

  });
}
// END the loadDataFile function
