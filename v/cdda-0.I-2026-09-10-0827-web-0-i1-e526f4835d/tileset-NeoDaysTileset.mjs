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
      var PACKAGE_NAME = 'build/tileset-NeoDaysTileset.data';
      var REMOTE_PACKAGE_BASE = 'tileset-NeoDaysTileset.data';
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
Module['FS_createPath']("/gfx", "NeoDaysTileset", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        var compressedData = {"data":null,"cachedOffset":400316,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2048,4096,6144,8192,10240,12288,14336,16384,18432,20480,22528,24576,26624,28672,30720,32768,34816,36864,38912,40960,43008,45056,47104,49148,51196,53244,55292,57284,59225,61208,63263,65202,67113,69135,71152,73136,75103,76790,77573,78247,78696,79158,79617,80176,80674,81193,81715,82200,82717,83249,83733,84245,84800,85318,85793,86314,86744,87269,87824,88336,88858,89390,90094,90651,91171,91716,92274,92937,93531,94253,94939,95701,96672,97493,98309,99216,99989,100852,101655,102536,103414,104252,105076,105892,106728,107684,108515,109362,110195,111076,111957,112724,113484,114278,115011,115945,116761,117430,118282,118935,119512,120197,120739,121460,122164,123048,124030,124980,125922,126683,127417,128233,129129,130004,130964,131825,132660,133459,134201,135063,135875,136707,137530,138415,139253,140147,141111,141830,142633,143480,144350,145237,146094,146905,147765,148528,149320,150120,150845,151559,152312,152813,153516,154221,154804,155407,156231,157038,157830,158622,159462,160313,161051,161769,162382,163273,164071,164736,165422,166082,166633,167246,167958,168632,169230,169724,170170,170743,171315,171824,172459,173178,173958,174439,174867,175472,175915,176395,176915,177486,177930,178441,178863,179395,179869,180220,180681,181198,181718,182113,182473,182941,183483,183915,184311,184833,185262,185589,186066,186447,186843,187219,187550,188433,189314,189965,190890,191671,192570,193496,194399,195235,196057,196602,197053,197482,197909,198334,198763,199333,199902,200529,201310,202023,202734,203474,204255,204939,205735,206535,207300,208062,208816,209488,209977,210468,210982,211480,211997,212540,213263,214025,214705,215416,216127,216865,217615,218366,219100,219919,220693,221429,222136,222825,223526,224157,224766,225405,226148,226791,227461,228056,228628,229234,229902,230659,231340,232023,232800,233531,234297,235081,235837,236825,237275,237706,238264,238756,239287,239919,240492,241094,241690,242290,242846,243468,244039,244637,245161,245726,246276,246900,247539,248148,248767,249350,249942,250512,251049,251484,251891,252376,252866,253340,253739,254242,254782,255528,256203,256681,257158,257645,258129,258614,259098,259586,260077,260570,261175,261753,262279,262922,264400,266398,268422,270416,272435,274471,276524,278572,280622,282670,284718,286766,288814,290862,292910,294958,297006,299054,301102,303150,305198,307246,309294,311342,313390,315438,317493,319541,321589,323637,325694,327727,329775,331823,333871,335919,337967,340015,342063,344111,346159,348207,350255,352303,354351,356408,358456,360504,362552,364600,366648,368696,370744,372792,374840,376888,378936,380984,383032,385080,387128,389176,391224,393272,395320,397368,399416],"sizes":[2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2044,2048,2048,2048,1992,1941,1983,2055,1939,1911,2022,2017,1984,1967,1687,783,674,449,462,459,559,498,519,522,485,517,532,484,512,555,518,475,521,430,525,555,512,522,532,704,557,520,545,558,663,594,722,686,762,971,821,816,907,773,863,803,881,878,838,824,816,836,956,831,847,833,881,881,767,760,794,733,934,816,669,852,653,577,685,542,721,704,884,982,950,942,761,734,816,896,875,960,861,835,799,742,862,812,832,823,885,838,894,964,719,803,847,870,887,857,811,860,763,792,800,725,714,753,501,703,705,583,603,824,807,792,792,840,851,738,718,613,891,798,665,686,660,551,613,712,674,598,494,446,573,572,509,635,719,780,481,428,605,443,480,520,571,444,511,422,532,474,351,461,517,520,395,360,468,542,432,396,522,429,327,477,381,396,376,331,883,881,651,925,781,899,926,903,836,822,545,451,429,427,425,429,570,569,627,781,713,711,740,781,684,796,800,765,762,754,672,489,491,514,498,517,543,723,762,680,711,711,738,750,751,734,819,774,736,707,689,701,631,609,639,743,643,670,595,572,606,668,757,681,683,777,731,766,784,756,988,450,431,558,492,531,632,573,602,596,600,556,622,571,598,524,565,550,624,639,609,619,583,592,570,537,435,407,485,490,474,399,503,540,746,675,478,477,487,484,485,484,488,491,493,605,578,526,643,1478,1998,2024,1994,2019,2036,2053,2048,2050,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2055,2048,2048,2048,2057,2033,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,900],"successes":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
;
            compressedData['data'] = byteArray;
            assert(typeof Module['LZ4'] === 'object', 'LZ4 not present - was your app build with -sLZ4?');
            await Module['LZ4'].loadPackage({ 'metadata': metadata, 'compressedData': compressedData }, false);
            Module['removeRunDependency']('datafile_build/tileset-NeoDaysTileset.data');
loadDataResolve();
      }
      Module['addRunDependency']('datafile_build/tileset-NeoDaysTileset.data');

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
    loadPackage({"files": [{"filename": "/gfx/NeoDaysTileset/fallback.png", "start": 0, "end": 47126}, {"filename": "/gfx/NeoDaysTileset/large.png", "start": 47126, "end": 77247}, {"filename": "/gfx/NeoDaysTileset/layering.json", "start": 77247, "end": 78792}, {"filename": "/gfx/NeoDaysTileset/tile_config.json", "start": 78792, "end": 660299}, {"filename": "/gfx/NeoDaysTileset/tiles.png", "start": 660299, "end": 797572}], "remote_package_size": 404412});

  });
}
// END the loadDataFile function
