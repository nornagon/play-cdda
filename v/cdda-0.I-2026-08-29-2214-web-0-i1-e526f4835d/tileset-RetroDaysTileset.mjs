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
      var PACKAGE_NAME = 'build/tileset-RetroDaysTileset.data';
      var REMOTE_PACKAGE_BASE = 'tileset-RetroDaysTileset.data';
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
Module['FS_createPath']("/gfx", "RetroDaysTileset", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        var compressedData = {"data":null,"cachedOffset":244078,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2048,4096,6144,8192,10240,12288,14336,16384,18432,20480,22369,24383,26431,28338,29286,29931,30610,31222,31782,32327,32912,33573,34274,34932,35684,36431,37157,37789,38492,39224,39888,40553,41340,42015,42950,43753,44579,45389,46177,47025,47864,48539,49184,49927,50533,51347,52156,52973,53716,54554,55367,56168,56995,57885,58679,59497,60268,61044,61799,62567,63238,63864,64604,65384,66065,66924,67645,68463,69259,70182,70956,71784,72525,73280,74102,74871,75696,76494,77387,78250,79105,79926,80749,81649,82498,83334,84087,84968,85711,86533,87308,88048,88871,89673,90472,91326,92041,92871,93631,94395,95180,96025,96820,97593,98490,99329,100159,100805,101476,102175,102853,103577,104266,104979,105674,106335,107078,107819,108442,109107,109788,110385,110986,111568,112136,112649,113247,113608,114288,114882,115504,116110,116712,117479,118211,118944,119736,120422,120981,121653,122417,123111,123786,124528,125188,125949,126702,127330,127960,128595,129323,130003,130760,131260,131767,132316,132860,133423,133957,134476,135016,135648,136135,136805,137452,138054,138520,139124,139642,140292,140669,141038,141540,141988,142432,142944,143325,143669,144061,144557,144993,145525,146084,146592,146983,147453,147911,148288,148693,149084,149621,150325,150873,151651,152424,153201,153978,154677,155333,156178,156914,158914,160952,162973,165021,167069,169117,171174,173225,175281,177337,179385,181433,183488,185536,187591,189639,191687,193735,195783,197839,199887,201935,203983,206031,208079,210127,212175,214223,216271,218323,220371,222423,224478,226526,228583,230637,232685,234733,236784,238832,240880,242928],"sizes":[2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,1889,2014,2048,1907,948,645,679,612,560,545,585,661,701,658,752,747,726,632,703,732,664,665,787,675,935,803,826,810,788,848,839,675,645,743,606,814,809,817,743,838,813,801,827,890,794,818,771,776,755,768,671,626,740,780,681,859,721,818,796,923,774,828,741,755,822,769,825,798,893,863,855,821,823,900,849,836,753,881,743,822,775,740,823,802,799,854,715,830,760,764,785,845,795,773,897,839,830,646,671,699,678,724,689,713,695,661,743,741,623,665,681,597,601,582,568,513,598,361,680,594,622,606,602,767,732,733,792,686,559,672,764,694,675,742,660,761,753,628,630,635,728,680,757,500,507,549,544,563,534,519,540,632,487,670,647,602,466,604,518,650,377,369,502,448,444,512,381,344,392,496,436,532,559,508,391,470,458,377,405,391,537,704,548,778,773,777,777,699,656,845,736,2000,2038,2021,2048,2048,2048,2057,2051,2056,2056,2048,2048,2055,2048,2055,2048,2048,2048,2048,2056,2048,2048,2048,2048,2048,2048,2048,2048,2048,2052,2048,2052,2055,2048,2057,2054,2048,2048,2051,2048,2048,2048,1150],"successes":[0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1,1,0,1,1,0,0,1,0,0,0,0]}
;
            compressedData['data'] = byteArray;
            assert(typeof Module['LZ4'] === 'object', 'LZ4 not present - was your app build with -sLZ4?');
            await Module['LZ4'].loadPackage({ 'metadata': metadata, 'compressedData': compressedData }, false);
            Module['removeRunDependency']('datafile_build/tileset-RetroDaysTileset.data');
loadDataResolve();
      }
      Module['addRunDependency']('datafile_build/tileset-RetroDaysTileset.data');

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
    loadPackage({"files": [{"filename": "/gfx/RetroDaysTileset/fallback.png", "start": 0, "end": 28240}, {"filename": "/gfx/RetroDaysTileset/overlay_ordering.json", "start": 28240, "end": 29528}, {"filename": "/gfx/RetroDaysTileset/tile_config.json", "start": 29528, "end": 411806}, {"filename": "/gfx/RetroDaysTileset/tiles.png", "start": 411806, "end": 494378}, {"filename": "/gfx/RetroDaysTileset/tiles_20x20.png", "start": 494378, "end": 498814}], "remote_package_size": 248174});

  });
}
// END the loadDataFile function
