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
        var compressedData = {"data":null,"cachedOffset":502973,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,1371,3333,4981,6950,8937,10795,12718,14693,16698,18528,20509,22560,24608,26656,28713,30761,32809,34857,36905,38953,41010,43067,45115,47163,49211,51259,53307,55355,57411,59459,61507,63564,65612,67660,69379,70608,72455,74235,75839,77500,79243,80908,82374,84422,86475,87430,87796,88219,88770,89369,89895,90502,91012,91510,92158,92810,93278,93828,94349,94976,95574,96209,96833,97485,98139,98528,98900,99277,99758,100207,100639,100989,101317,101675,102009,102456,102940,103436,103927,104353,104831,105315,105851,106387,106875,107385,107871,108380,108814,109282,109754,110103,110569,111058,111562,112066,112568,113034,113496,113822,114369,114861,115305,115831,116270,116596,116928,117422,117910,118448,118874,119398,119890,120388,120805,121255,121720,122245,122680,123171,123547,124011,124525,124937,125331,125758,126196,126659,127094,127567,128009,128419,128852,129318,129792,130264,130656,131112,131542,131990,132439,132846,133247,133694,134117,134544,134988,135427,135864,136343,136821,137291,137734,138131,138566,139021,139489,139931,140398,140812,141293,141702,142137,142575,143012,143452,143897,144336,144853,145456,145947,146479,146993,147481,147969,148470,148980,149541,150191,150773,151245,151897,152597,153196,153724,154265,154745,155292,155787,156239,156683,157377,157970,158599,159142,159813,160317,160705,161175,161646,162045,162507,162972,163328,163781,164292,164721,165161,165562,166138,166825,167295,167728,168178,168716,169194,169705,170237,170769,171212,171702,172320,172901,173353,173874,174390,174807,175337,175835,176288,176964,177550,178102,178522,178931,179256,179702,180011,180462,180763,181188,181599,181976,182367,182644,182942,183199,183445,184049,184658,185229,185474,185762,186025,186277,186520,186844,187337,187965,188521,189030,189289,189643,190235,190821,191409,191951,192340,192728,193142,193594,193890,194630,195438,196196,196910,197651,198401,199136,199820,201255,203084,204835,205526,207583,209586,211634,213690,215738,217779,219833,221881,223929,225977,228025,230073,232121,234169,236217,238270,240318,242366,244414,246462,248513,250561,252609,254649,256706,258748,260802,262850,264907,266955,269003,271059,273115,275171,277227,279275,281323,283379,285427,287471,289528,291583,293631,295685,297733,299781,301829,303877,305925,307973,310021,312069,314117,316165,318215,320258,322315,324363,326415,328463,330511,332559,334607,336655,338703,340751,342799,344847,346895,348943,350991,353039,355087,357142,359190,361238,363286,365338,367386,369434,371482,373530,375578,377626,379674,381731,383779,385827,387875,389923,391971,394019,396067,398115,400163,402218,404275,406323,408380,410359,412390,414445,416493,418541,420589,422637,424685,426732,428780,430828,432876,434924,436972,439020,441075,443123,445171,447219,449267,451315,453363,455411,457459,459516,461564,463612,465660,467708,469756,471804,473808,475181,477098,478995,480823,482138,483696,485744,487781,489093,490879,492735,494519,496470,498448,500223,502271],"sizes":[1371,1962,1648,1969,1987,1858,1923,1975,2005,1830,1981,2051,2048,2048,2057,2048,2048,2048,2048,2048,2057,2057,2048,2048,2048,2048,2048,2048,2056,2048,2048,2057,2048,2048,1719,1229,1847,1780,1604,1661,1743,1665,1466,2048,2053,955,366,423,551,599,526,607,510,498,648,652,468,550,521,627,598,635,624,652,654,389,372,377,481,449,432,350,328,358,334,447,484,496,491,426,478,484,536,536,488,510,486,509,434,468,472,349,466,489,504,504,502,466,462,326,547,492,444,526,439,326,332,494,488,538,426,524,492,498,417,450,465,525,435,491,376,464,514,412,394,427,438,463,435,473,442,410,433,466,474,472,392,456,430,448,449,407,401,447,423,427,444,439,437,479,478,470,443,397,435,455,468,442,467,414,481,409,435,438,437,440,445,439,517,603,491,532,514,488,488,501,510,561,650,582,472,652,700,599,528,541,480,547,495,452,444,694,593,629,543,671,504,388,470,471,399,462,465,356,453,511,429,440,401,576,687,470,433,450,538,478,511,532,532,443,490,618,581,452,521,516,417,530,498,453,676,586,552,420,409,325,446,309,451,301,425,411,377,391,277,298,257,246,604,609,571,245,288,263,252,243,324,493,628,556,509,259,354,592,586,588,542,389,388,414,452,296,740,808,758,714,741,750,735,684,1435,1829,1751,691,2057,2003,2048,2056,2048,2041,2054,2048,2048,2048,2048,2048,2048,2048,2048,2053,2048,2048,2048,2048,2051,2048,2048,2040,2057,2042,2054,2048,2057,2048,2048,2056,2056,2056,2056,2048,2048,2056,2048,2044,2057,2055,2048,2054,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2050,2043,2057,2048,2052,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2055,2048,2048,2048,2052,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2055,2057,2048,2057,1979,2031,2055,2048,2048,2048,2048,2048,2047,2048,2048,2048,2048,2048,2048,2055,2048,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2004,1373,1917,1897,1828,1315,1558,2048,2037,1312,1786,1856,1784,1951,1978,1775,2048,702],"successes":[1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,1,0,0,1,0,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,1,1,1,1,0,1,0,0,1,1,1,1,0,0,1,0,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1]}
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
    loadPackage({"files": [{"filename": "/gfx/BrownLikeBears/big.png", "start": 0, "end": 24825}, {"filename": "/gfx/BrownLikeBears/fallback.png", "start": 24825, "end": 70523}, {"filename": "/gfx/BrownLikeBears/mods.png", "start": 70523, "end": 91964}, {"filename": "/gfx/BrownLikeBears/tall.png", "start": 91964, "end": 92657}, {"filename": "/gfx/BrownLikeBears/tile_config.json", "start": 92657, "end": 573556}, {"filename": "/gfx/BrownLikeBears/tiles.png", "start": 573556, "end": 849552}, {"filename": "/gfx/BrownLikeBears/toped.png", "start": 849552, "end": 866141}, {"filename": "/gfx/BrownLikeBears/wide.png", "start": 866141, "end": 883388}], "remote_package_size": 507069});

  });
}
// END the loadDataFile function
