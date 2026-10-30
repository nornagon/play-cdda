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
      var PACKAGE_NAME = 'build/tileset-SmashButton_iso.data';
      var REMOTE_PACKAGE_BASE = 'tileset-SmashButton_iso.data';
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
Module['FS_createPath']("/gfx", "SmashButton_iso", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        var compressedData = {"data":null,"cachedOffset":271272,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2052,4107,6155,8211,10263,12311,14366,16422,18472,20520,22567,24616,26662,28715,30765,32817,34872,36920,38972,41029,43075,45129,47186,49234,51280,53330,55381,57437,59494,61551,63605,65653,67410,69454,71444,73501,75445,77473,79521,81569,83617,85665,87713,89755,91722,93641,95613,97569,99518,101448,103389,105296,107228,109192,111238,113293,115341,117334,119372,121420,123473,125526,127577,129625,131669,133713,135761,137809,139857,141905,143953,146008,147972,150017,152019,154075,156073,158034,160068,161946,163995,166043,168091,170148,172205,174260,175387,175683,176020,176493,176988,177681,178312,178933,179550,180145,180720,181336,181940,182622,183246,183926,184653,185368,186059,186746,187381,188008,188647,189293,189886,190541,191206,192029,192736,193482,194230,195071,195940,196768,197602,198419,199152,199772,200466,201192,201942,202872,203750,204794,205537,206436,207248,208121,209099,209996,210958,211864,212763,213684,214496,215332,216217,217147,218037,218993,219812,220772,221649,222589,223513,224412,225237,226063,226925,227927,228817,229684,230527,231405,232294,233237,234102,234890,235797,236799,237740,238612,239540,240475,241401,242326,243107,243954,244711,245413,246094,246720,247644,248344,249126,250036,250732,251507,252291,253082,253897,254637,255481,256181,256735,257329,258086,258723,259365,259860,260352,260926,261877,262592,263057,263629,264299,264851,265466,265948,266421,266946,267626,268295,268877,269464,270202,270984],"sizes":[2052,2055,2048,2056,2052,2048,2055,2056,2050,2048,2047,2049,2046,2053,2050,2052,2055,2048,2052,2057,2046,2054,2057,2048,2046,2050,2051,2056,2057,2057,2054,2048,1757,2044,1990,2057,1944,2028,2048,2048,2048,2048,2048,2042,1967,1919,1972,1956,1949,1930,1941,1907,1932,1964,2046,2055,2048,1993,2038,2048,2053,2053,2051,2048,2044,2044,2048,2048,2048,2048,2048,2055,1964,2045,2002,2056,1998,1961,2034,1878,2049,2048,2048,2057,2057,2055,1127,296,337,473,495,693,631,621,617,595,575,616,604,682,624,680,727,715,691,687,635,627,639,646,593,655,665,823,707,746,748,841,869,828,834,817,733,620,694,726,750,930,878,1044,743,899,812,873,978,897,962,906,899,921,812,836,885,930,890,956,819,960,877,940,924,899,825,826,862,1002,890,867,843,878,889,943,865,788,907,1002,941,872,928,935,926,925,781,847,757,702,681,626,924,700,782,910,696,775,784,791,815,740,844,700,554,594,757,637,642,495,492,574,951,715,465,572,670,552,615,482,473,525,680,669,582,587,738,782,288],"successes":[1,1,0,1,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,0,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
;
            compressedData['data'] = byteArray;
            assert(typeof Module['LZ4'] === 'object', 'LZ4 not present - was your app build with -sLZ4?');
            await Module['LZ4'].loadPackage({ 'metadata': metadata, 'compressedData': compressedData }, false);
            Module['removeRunDependency']('datafile_build/tileset-SmashButton_iso.data');
loadDataResolve();
      }
      Module['addRunDependency']('datafile_build/tileset-SmashButton_iso.data');

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
    loadPackage({"files": [{"filename": "/gfx/SmashButton_iso/fallback.png", "start": 0, "end": 64045}, {"filename": "/gfx/SmashButton_iso/full_iso.png", "start": 64045, "end": 172724}, {"filename": "/gfx/SmashButton_iso/short_iso.png", "start": 172724, "end": 176471}, {"filename": "/gfx/SmashButton_iso/tile_config.json", "start": 176471, "end": 439190}], "remote_package_size": 275368});

  });
}
// END the loadDataFile function
