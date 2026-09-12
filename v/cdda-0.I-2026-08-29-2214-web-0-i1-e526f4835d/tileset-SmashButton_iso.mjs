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
        var compressedData = {"data":null,"cachedOffset":282082,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2052,4107,6155,8211,10263,12311,14366,16422,18472,20520,22567,24616,26662,28715,30765,32817,34872,36920,38972,41029,43075,45129,47186,49234,51280,53330,55381,57437,59494,61551,63605,65200,66445,68237,69893,71834,73770,75733,77582,79545,81593,83641,85465,87516,89564,91612,93660,95708,97756,99789,101694,103626,105582,107518,109459,111355,113233,115183,117155,119141,121189,123243,125229,127277,129332,131380,133428,135476,137524,139572,141613,143661,145709,147760,149808,151856,153904,155935,157939,159941,161988,164019,165985,167975,169939,171911,173959,176007,178064,180094,181332,182538,184586,186028,186390,186665,187123,187490,188278,188922,189517,190181,190724,191350,191978,192574,193232,193875,194554,195195,195914,196616,197288,197902,198596,199190,199861,200439,201076,201761,202496,203244,203932,204724,205545,206386,207274,208186,209097,209799,210422,211109,211807,212546,213460,214354,215329,216126,217050,217876,218729,219668,220605,221588,222474,223256,224215,225104,225887,226815,227681,228596,229578,230393,231306,232237,233139,234061,234945,235801,236627,237463,238450,239380,240228,241072,241883,242808,243755,244572,245376,246285,247284,248170,249036,250028,250855,251781,252710,253450,254338,255131,255817,256479,257114,258038,258801,259614,260522,261176,261984,262815,263572,264354,265053,265979,266582,267247,267818,268587,269230,269936,270487,271067,271651,272479,273298,273813,274408,275076,275653,276251,276733,277194,277726,278247,278986,279565,280119,280835,281582],"sizes":[2052,2055,2048,2056,2052,2048,2055,2056,2050,2048,2047,2049,2046,2053,2050,2052,2055,2048,2052,2057,2046,2054,2057,2048,2046,2050,2051,2056,2057,2057,2054,1595,1245,1792,1656,1941,1936,1963,1849,1963,2048,2048,1824,2051,2048,2048,2048,2048,2048,2033,1905,1932,1956,1936,1941,1896,1878,1950,1972,1986,2048,2054,1986,2048,2055,2048,2048,2048,2048,2048,2041,2048,2048,2051,2048,2048,2048,2031,2004,2002,2047,2031,1966,1990,1964,1972,2048,2048,2057,2030,1238,1206,2048,1442,362,275,458,367,788,644,595,664,543,626,628,596,658,643,679,641,719,702,672,614,694,594,671,578,637,685,735,748,688,792,821,841,888,912,911,702,623,687,698,739,914,894,975,797,924,826,853,939,937,983,886,782,959,889,783,928,866,915,982,815,913,931,902,922,884,856,826,836,987,930,848,844,811,925,947,817,804,909,999,886,866,992,827,926,929,740,888,793,686,662,635,924,763,813,908,654,808,831,757,782,699,926,603,665,571,769,643,706,551,580,584,828,819,515,595,668,577,598,482,461,532,521,739,579,554,716,747,500],"successes":[1,1,0,1,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,0,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,0,0,0,0,0,1,0,0,1,0,0,0,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
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
    loadPackage({"files": [{"filename": "/gfx/SmashButton_iso/fallback.png", "start": 0, "end": 64045}, {"filename": "/gfx/SmashButton_iso/full_iso.png", "start": 64045, "end": 183993}, {"filename": "/gfx/SmashButton_iso/short_iso.png", "start": 183993, "end": 191307}, {"filename": "/gfx/SmashButton_iso/tile_config.json", "start": 191307, "end": 454026}], "remote_package_size": 286178});

  });
}
// END the loadDataFile function
