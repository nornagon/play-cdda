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
      var PACKAGE_NAME = 'build/tileset-Retrodays.data';
      var REMOTE_PACKAGE_BASE = 'tileset-Retrodays.data';
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
Module['FS_createPath']("/gfx", "Retrodays", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        var compressedData = {"data":null,"cachedOffset":252222,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2048,4096,6144,8192,10240,12288,14336,16384,18432,20480,22369,24383,26431,28372,29031,29751,30332,30901,31477,32061,32749,33437,34134,34860,35601,36323,36947,37673,38414,39163,39781,40595,41187,42140,42892,43721,44500,45302,46087,46931,47626,48299,49057,49628,50453,51246,52070,52835,53642,54491,55277,56072,56972,57776,58582,59395,60147,60911,61705,62419,63054,63767,64545,65270,66118,66817,67665,68452,69353,70145,70951,71680,72462,73270,74065,74901,75687,76569,77425,78312,79121,79972,80862,81718,82582,83390,84192,84959,85785,86563,87316,88095,88927,89775,90611,91331,92114,92906,93660,94455,95284,96071,96859,97734,98588,99373,100099,100765,101540,102154,102836,103595,104326,105016,105698,106359,107114,107827,108483,109169,109802,110425,111017,111598,112151,112737,113153,113726,114390,114965,115508,116166,116864,117589,118376,119060,119744,120383,120978,121659,122404,123055,123682,124412,125191,125958,126559,127168,127773,128438,129160,129983,130577,131085,131627,132193,132677,133255,133761,134331,134924,135460,136098,136772,137505,138017,138564,139089,139681,140148,140572,140949,141466,141873,142371,142804,143149,143589,144008,144530,145038,145583,146032,146529,146957,147379,147852,148266,148688,149071,149705,150251,151044,151799,152607,153410,154150,154826,155554,156306,157073,158149,159570,161121,162536,164149,166025,168033,170090,172138,174186,176243,178291,180339,182387,184435,186489,188537,190585,192633,194681,196729,198777,200825,202873,204921,206969,209017,211065,213113,215161,217209,219257,221305,223353,225401,227458,229506,231557,233605,235653,237701,239749,241797,243845,245893,247941,249989,252037],"sizes":[2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,1889,2014,2048,1941,659,720,581,569,576,584,688,688,697,726,741,722,624,726,741,749,618,814,592,953,752,829,779,802,785,844,695,673,758,571,825,793,824,765,807,849,786,795,900,804,806,813,752,764,794,714,635,713,778,725,848,699,848,787,901,792,806,729,782,808,795,836,786,882,856,887,809,851,890,856,864,808,802,767,826,778,753,779,832,848,836,720,783,792,754,795,829,787,788,875,854,785,726,666,775,614,682,759,731,690,682,661,755,713,656,686,633,623,592,581,553,586,416,573,664,575,543,658,698,725,787,684,684,639,595,681,745,651,627,730,779,767,601,609,605,665,722,823,594,508,542,566,484,578,506,570,593,536,638,674,733,512,547,525,592,467,424,377,517,407,498,433,345,440,419,522,508,545,449,497,428,422,473,414,422,383,634,546,793,755,808,803,740,676,728,752,767,1076,1421,1551,1415,1613,1876,2008,2057,2048,2048,2057,2048,2048,2048,2048,2054,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2057,2048,2051,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,185],"successes":[0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0]}
;
            compressedData['data'] = byteArray;
            assert(typeof Module['LZ4'] === 'object', 'LZ4 not present - was your app build with -sLZ4?');
            await Module['LZ4'].loadPackage({ 'metadata': metadata, 'compressedData': compressedData }, false);
            Module['removeRunDependency']('datafile_build/tileset-Retrodays.data');
loadDataResolve();
      }
      Module['addRunDependency']('datafile_build/tileset-Retrodays.data');

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
    loadPackage({"files": [{"filename": "/gfx/Retrodays/fallback.png", "start": 0, "end": 28240}, {"filename": "/gfx/Retrodays/tile_config.json", "start": 28240, "end": 412444}, {"filename": "/gfx/Retrodays/tiles.png", "start": 412444, "end": 505708}, {"filename": "/gfx/Retrodays/tiles_20x20.png", "start": 505708, "end": 510137}], "remote_package_size": 256318});

  });
}
// END the loadDataFile function
