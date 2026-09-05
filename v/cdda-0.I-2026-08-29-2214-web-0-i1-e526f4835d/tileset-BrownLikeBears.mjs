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
        var compressedData = {"data":null,"cachedOffset":444500,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2057,4110,6158,8206,10254,12309,14357,16405,18453,20501,22558,24606,26654,28702,30750,32798,34846,36894,38942,40999,43047,45095,47143,49191,51239,53287,54889,55270,55715,56135,56775,57354,57879,58426,58956,59565,60253,60693,61208,61795,62319,62964,63598,64236,64924,65539,66066,66410,66791,67263,67719,68155,68539,68869,69226,69570,69972,70443,70916,71395,71862,72308,72727,73300,73829,74348,74838,75308,75817,76271,76770,77193,77651,78045,78551,79009,79596,80054,80544,81007,81348,81838,82307,82793,83313,83748,84161,84439,84840,85389,85874,86433,86917,87377,87898,88363,88807,89291,89746,90211,90702,91085,91497,91998,92454,92845,93235,93640,94131,94636,95118,95534,95982,96377,96797,97286,97778,98215,98611,99080,99528,99966,100419,100758,101190,101643,102056,102448,102881,103304,103743,104266,104732,105171,105590,106012,106491,106917,107374,107838,108255,108739,109198,109610,110043,110520,110967,111407,111842,112402,113003,113491,114071,114570,115057,115566,116064,116545,117052,117794,118263,118895,119455,120083,120775,121368,122012,122462,122924,123415,123924,124410,125056,125655,126201,126847,127490,128111,128481,128916,129320,129764,130193,130763,131124,131586,132043,132544,132999,133438,133929,134593,135105,135601,136023,136473,137055,137615,138081,138532,138983,139426,140045,140695,141145,141603,142042,142553,143162,143628,144077,144613,145208,145853,146273,146700,147027,147410,147832,148195,148564,148932,149416,149702,150114,150477,150791,151066,151328,151860,152449,153043,153379,153630,153874,154120,154352,154605,155087,155552,156165,156724,156959,157249,157731,158388,158866,159514,159901,160323,160715,161187,161444,161935,162762,163536,164205,164998,165734,166494,167305,168727,170770,172825,174873,176921,178969,180974,183022,185070,187118,189166,191222,193270,195318,197366,199414,201462,203510,205558,207606,209654,211709,213757,215808,217856,219912,221915,223963,226011,228059,230107,232155,234203,236251,238299,240347,242395,244443,246491,248541,250588,252636,254692,256740,258796,260844,262892,264940,266988,269036,271084,273132,275180,277228,279276,281322,283368,285416,287472,289529,291577,293625,295673,297721,299769,301817,303865,305913,307961,310009,312057,314105,316153,318201,320256,322304,324352,326400,328448,330496,332544,334592,336640,338688,340736,342784,344832,346886,348934,350982,353030,355078,357126,359174,361230,363278,365326,367374,369422,371470,373444,375492,377547,379595,381643,383691,385748,387796,389838,391886,393940,395988,398036,400084,402132,404180,406228,408276,410309,412357,414405,416453,418501,420556,422604,424652,426700,428748,430796,432844,434892,436942,438990,441046,443103],"sizes":[2057,2053,2048,2048,2048,2055,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,1602,381,445,420,640,579,525,547,530,609,688,440,515,587,524,645,634,638,688,615,527,344,381,472,456,436,384,330,357,344,402,471,473,479,467,446,419,573,529,519,490,470,509,454,499,423,458,394,506,458,587,458,490,463,341,490,469,486,520,435,413,278,401,549,485,559,484,460,521,465,444,484,455,465,491,383,412,501,456,391,390,405,491,505,482,416,448,395,420,489,492,437,396,469,448,438,453,339,432,453,413,392,433,423,439,523,466,439,419,422,479,426,457,464,417,484,459,412,433,477,447,440,435,560,601,488,580,499,487,509,498,481,507,742,469,632,560,628,692,593,644,450,462,491,509,486,646,599,546,646,643,621,370,435,404,444,429,570,361,462,457,501,455,439,491,664,512,496,422,450,582,560,466,451,451,443,619,650,450,458,439,511,609,466,449,536,595,645,420,427,327,383,422,363,369,368,484,286,412,363,314,275,262,532,589,594,336,251,244,246,232,253,482,465,613,559,235,290,482,657,478,648,387,422,392,472,257,491,827,774,669,793,736,760,811,1422,2043,2055,2048,2048,2048,2005,2048,2048,2048,2048,2056,2048,2048,2048,2048,2048,2048,2048,2048,2048,2055,2048,2051,2048,2056,2003,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2050,2047,2048,2056,2048,2056,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2046,2046,2048,2056,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2055,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2054,2048,2048,2048,2048,2048,2048,2056,2048,2048,2048,2048,2048,1974,2048,2055,2048,2048,2048,2057,2048,2042,2048,2054,2048,2048,2048,2048,2048,2048,2048,2033,2048,2048,2048,2048,2055,2048,2048,2048,2048,2048,2048,2048,2050,2048,2056,2057,1397],"successes":[1,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,1,1,1]}
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
    loadPackage({"files": [{"filename": "/gfx/BrownLikeBears/big.png", "start": 0, "end": 3397}, {"filename": "/gfx/BrownLikeBears/fallback.png", "start": 3397, "end": 49095}, {"filename": "/gfx/BrownLikeBears/mods.png", "start": 49095, "end": 53884}, {"filename": "/gfx/BrownLikeBears/tall.png", "start": 53884, "end": 54540}, {"filename": "/gfx/BrownLikeBears/tile_config.json", "start": 54540, "end": 535439}, {"filename": "/gfx/BrownLikeBears/tiles.png", "start": 535439, "end": 803913}, {"filename": "/gfx/BrownLikeBears/toped.png", "start": 803913, "end": 809025}, {"filename": "/gfx/BrownLikeBears/wide.png", "start": 809025, "end": 812399}], "remote_package_size": 448596});

  });
}
// END the loadDataFile function
