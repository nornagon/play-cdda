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
      var PACKAGE_NAME = 'build/tileset-BrownLikeBears.data';
      var REMOTE_PACKAGE_BASE = 'tileset-BrownLikeBears.data';
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
Module['FS_createPath']("/gfx", "BrownLikeBears", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        var compressedData = {"data":null,"cachedOffset":444524,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2057,4110,6158,8206,10254,12309,14357,16405,18453,20501,22558,24606,26654,28702,30750,32798,34846,36894,38942,40999,43047,45095,47143,49191,51239,53287,54898,55278,55725,56146,56786,57365,57890,58437,58968,59577,60266,60707,61222,61809,62333,62977,63611,64246,64934,65548,66074,66419,66800,67272,67728,68164,68547,68877,69234,69579,69981,70452,70924,71403,71871,72323,72742,73315,73844,74364,74854,75323,75832,76286,76785,77208,77667,78059,78565,79023,79609,80067,80556,81019,81359,81851,82321,82807,83327,83763,84176,84454,84858,85406,85891,86450,86934,87394,87915,88381,88823,89309,89764,90229,90717,91100,91511,92012,92469,92860,93252,93658,94149,94654,95137,95553,96001,96396,96815,97305,97797,98233,98629,99098,99546,99984,100436,100775,101207,101657,102070,102462,102894,103316,103754,104278,104747,105186,105605,106028,106505,106931,107386,107850,108271,108756,109215,109630,110065,110542,110988,111428,111862,112421,113022,113509,114090,114590,115077,115586,116083,116564,117071,117813,118281,118913,119474,120106,120796,121389,122034,122484,122948,123441,123949,124435,125079,125679,126233,126879,127520,128141,128511,128946,129349,129793,130222,130793,131154,131618,132077,132577,133031,133470,133960,134623,135132,135625,136047,136497,137078,137638,138102,138553,139003,139446,140064,140710,141160,141619,142057,142569,143183,143647,144096,144631,145226,145869,146287,146716,147044,147431,147853,148216,148585,148953,149438,149724,150137,150500,150813,151088,151350,151881,152470,153064,153399,153649,153893,154136,154368,154622,155105,155567,156181,156739,156973,157262,157746,158400,158878,159527,159913,160335,160726,161198,161453,161945,162769,163542,164208,165004,165739,166499,167310,168733,170757,172812,174860,176917,178965,180980,183028,185076,187124,189181,191229,193277,195325,197373,199421,201469,203517,205565,207613,209670,211726,213774,215829,217877,219925,221939,223987,226035,228083,230131,232179,234227,236275,238331,240379,242427,244475,246523,248571,250616,252664,254712,256760,258817,260865,262913,264970,267018,269066,271123,273171,275219,277267,279315,281358,283410,285458,287515,289572,291620,293668,295716,297764,299812,301860,303908,305956,308004,310052,312100,314148,316196,318244,320300,322348,324396,326444,328501,330549,332597,334645,336693,338741,340789,342837,344885,346937,348985,351033,353081,355129,357177,359225,361280,363328,365376,367424,369472,371520,373489,375537,377590,379638,381686,383734,385782,387830,389872,391920,393968,396016,398064,400112,402160,404208,406265,408313,410349,412397,414445,416493,418541,420592,422640,424688,426736,428784,430832,432888,434936,436983,439031,441087,443135],"sizes":[2057,2053,2048,2048,2048,2055,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,1611,380,447,421,640,579,525,547,531,609,689,441,515,587,524,644,634,635,688,614,526,345,381,472,456,436,383,330,357,345,402,471,472,479,468,452,419,573,529,520,490,469,509,454,499,423,459,392,506,458,586,458,489,463,340,492,470,486,520,436,413,278,404,548,485,559,484,460,521,466,442,486,455,465,488,383,411,501,457,391,392,406,491,505,483,416,448,395,419,490,492,436,396,469,448,438,452,339,432,450,413,392,432,422,438,524,469,439,419,423,477,426,455,464,421,485,459,415,435,477,446,440,434,559,601,487,581,500,487,509,497,481,507,742,468,632,561,632,690,593,645,450,464,493,508,486,644,600,554,646,641,621,370,435,403,444,429,571,361,464,459,500,454,439,490,663,509,493,422,450,581,560,464,451,450,443,618,646,450,459,438,512,614,464,449,535,595,643,418,429,328,387,422,363,369,368,485,286,413,363,313,275,262,531,589,594,335,250,244,243,232,254,483,462,614,558,234,289,484,654,478,649,386,422,391,472,255,492,824,773,666,796,735,760,811,1423,2024,2055,2048,2057,2048,2015,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2057,2056,2048,2055,2048,2048,2014,2048,2048,2048,2048,2048,2048,2048,2056,2048,2048,2048,2048,2048,2045,2048,2048,2048,2057,2048,2048,2057,2048,2048,2057,2048,2048,2048,2048,2043,2052,2048,2057,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2056,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2048,2052,2048,2048,2048,2048,2048,2048,2055,2048,2048,2048,2048,2048,1969,2048,2053,2048,2048,2048,2048,2048,2042,2048,2048,2048,2048,2048,2048,2048,2057,2048,2036,2048,2048,2048,2048,2051,2048,2048,2048,2048,2048,2056,2048,2047,2048,2056,2048,1389],"successes":[1,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,1,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1,0,1,0,1,0,0]}
;
            compressedData['data'] = byteArray;
            assert(typeof Module['LZ4'] === 'object', 'LZ4 not present - was your app build with -sLZ4?');
            await Module['LZ4'].loadPackage({ 'metadata': metadata, 'compressedData': compressedData }, false);
            Module['removeRunDependency']('datafile_build/tileset-BrownLikeBears.data');
loadDataResolve();
      }
      Module['addRunDependency']('datafile_build/tileset-BrownLikeBears.data');

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
    loadPackage({"files": [{"filename": "/gfx/BrownLikeBears/big.png", "start": 0, "end": 3397}, {"filename": "/gfx/BrownLikeBears/fallback.png", "start": 3397, "end": 49095}, {"filename": "/gfx/BrownLikeBears/mods.png", "start": 49095, "end": 53883}, {"filename": "/gfx/BrownLikeBears/tall.png", "start": 53883, "end": 54539}, {"filename": "/gfx/BrownLikeBears/tile_config.json", "start": 54539, "end": 535438}, {"filename": "/gfx/BrownLikeBears/tiles.png", "start": 535438, "end": 803911}, {"filename": "/gfx/BrownLikeBears/toped.png", "start": 803911, "end": 809023}, {"filename": "/gfx/BrownLikeBears/wide.png", "start": 809023, "end": 812397}], "remote_package_size": 448620});

  });
}
// END the loadDataFile function
