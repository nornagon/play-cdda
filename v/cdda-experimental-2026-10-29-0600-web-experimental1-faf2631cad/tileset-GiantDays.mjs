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
      var PACKAGE_NAME = 'build/tileset-GiantDays.data';
      var REMOTE_PACKAGE_BASE = 'tileset-GiantDays.data';
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
Module['FS_createPath']("/gfx", "GiantDays", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        var compressedData = {"data":null,"cachedOffset":594091,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,1719,2017,3748,5796,7844,9892,11940,13988,16036,18084,20132,22180,24228,26276,28324,30372,32420,34468,36516,38564,40612,42660,44708,46756,48804,50852,52900,54948,56996,59044,61092,63140,65188,67236,69284,71332,73380,75428,77476,79524,81572,83620,85668,87716,89764,91812,93860,95908,97956,100004,102052,104100,106148,108196,110244,112292,114340,116388,118436,120484,122541,124598,126651,128704,130752,132800,134848,136896,138953,141001,143056,145104,147152,149200,151248,153298,155346,157394,159442,161490,163538,165586,167634,169682,171720,173768,175816,177867,179915,181964,184019,186070,188108,189960,191973,194029,196086,198134,200182,202230,204278,206326,208374,210422,212470,214518,216566,218614,220662,222710,224758,226798,228833,230882,232933,234980,237033,239072,241120,243168,245216,247264,249312,251360,253369,255394,257446,259502,261555,263589,265515,267170,269169,271226,273279,275297,277109,278795,280525,282539,284544,286539,288535,290308,291677,293668,295657,297682,299583,301499,303367,305293,307314,309337,311392,313440,315443,317494,319542,321567,323615,325663,327711,329759,331807,333863,335911,337959,340007,342055,344112,346160,347772,348301,348826,349353,349995,350512,351170,351833,352677,353506,354398,355176,355887,356592,357274,357879,358554,359207,359807,360508,361207,361917,362516,363208,363902,364727,365342,366124,366952,367663,368355,368900,369577,370277,371003,371673,372272,372767,373376,373969,374498,375094,375892,376673,377168,377585,378139,378614,379100,379580,380181,380669,381135,381538,382060,382528,382944,383404,383978,384435,384818,385212,385678,386214,386654,387048,387556,388022,388379,388794,389206,389603,389951,390285,391047,391802,392557,393256,394024,394716,395432,396063,396853,397499,398106,398628,399142,399626,400146,400625,401132,401670,402160,402674,403235,403746,404259,404808,405279,405786,406324,406823,407337,407930,408558,409464,410210,410976,411664,412479,413080,413654,414185,414833,415420,415994,416718,417398,418024,418651,419370,420026,420726,421335,422162,423048,423868,424642,425425,426282,427009,427834,428686,429495,430273,431018,431861,432695,433581,434355,435240,436132,437026,437873,438741,439573,440312,441022,441780,442574,443424,444324,445058,445828,446602,447208,447906,448448,449163,449868,450726,451424,452104,452979,453870,454819,455663,456461,457198,458052,458829,459679,460512,461379,462219,463173,464056,464858,465727,466577,467432,468311,469149,470070,471042,471658,472546,473293,474162,474940,475837,476664,477555,478246,479042,479825,480587,481332,482000,482747,483454,484203,484993,485695,486484,487279,488046,488778,489489,490240,490995,491744,492813,493528,494006,494483,494962,495457,495937,496481,497002,497493,498131,498662,499236,499816,500413,500989,501559,502094,502667,503221,503772,504333,504947,505599,506227,506792,507380,507987,508566,509294,510018,510621,511139,511667,512244,512794,513487,514983,517031,519079,521127,523175,525229,527240,529288,531345,533393,535441,537494,539542,541578,543510,545542,547506,549459,551460,553517,555517,557517,559565,561613,563668,565725,567773,569813,571863,573909,575957,578005,580056,582104,584161,586209,588257,590301,592349],"sizes":[1719,298,1731,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2057,2057,2053,2053,2048,2048,2048,2048,2057,2048,2055,2048,2048,2048,2048,2050,2048,2048,2048,2048,2048,2048,2048,2048,2038,2048,2048,2051,2048,2049,2055,2051,2038,1852,2013,2056,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2040,2035,2049,2051,2047,2053,2039,2048,2048,2048,2048,2048,2048,2009,2025,2052,2056,2053,2034,1926,1655,1999,2057,2053,2018,1812,1686,1730,2014,2005,1995,1996,1773,1369,1991,1989,2025,1901,1916,1868,1926,2021,2023,2055,2048,2003,2051,2048,2025,2048,2048,2048,2048,2048,2056,2048,2048,2048,2048,2057,2048,1612,529,525,527,642,517,658,663,844,829,892,778,711,705,682,605,675,653,600,701,699,710,599,692,694,825,615,782,828,711,692,545,677,700,726,670,599,495,609,593,529,596,798,781,495,417,554,475,486,480,601,488,466,403,522,468,416,460,574,457,383,394,466,536,440,394,508,466,357,415,412,397,348,334,762,755,755,699,768,692,716,631,790,646,607,522,514,484,520,479,507,538,490,514,561,511,513,549,471,507,538,499,514,593,628,906,746,766,688,815,601,574,531,648,587,574,724,680,626,627,719,656,700,609,827,886,820,774,783,857,727,825,852,809,778,745,843,834,886,774,885,892,894,847,868,832,739,710,758,794,850,900,734,770,774,606,698,542,715,705,858,698,680,875,891,949,844,798,737,854,777,850,833,867,840,954,883,802,869,850,855,879,838,921,972,616,888,747,869,778,897,827,891,691,796,783,762,745,668,747,707,749,790,702,789,795,767,732,711,751,755,749,1069,715,478,477,479,495,480,544,521,491,638,531,574,580,597,576,570,535,573,554,551,561,614,652,628,565,588,607,579,728,724,603,518,528,577,550,693,1496,2048,2048,2048,2048,2054,2011,2048,2057,2048,2048,2053,2048,2036,1932,2032,1964,1953,2001,2057,2000,2000,2048,2048,2055,2057,2048,2040,2050,2046,2048,2048,2051,2048,2057,2048,2048,2044,2048,1742],"successes":[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,0,1,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,0,1,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,0,0,0,0,0,1,0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,0,1,0,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,0,0,1,0,1]}
;
            compressedData['data'] = byteArray;
            assert(typeof Module['LZ4'] === 'object', 'LZ4 not present - was your app build with -sLZ4?');
            await Module['LZ4'].loadPackage({ 'metadata': metadata, 'compressedData': compressedData }, false);
            Module['removeRunDependency']('datafile_build/tileset-GiantDays.data');
loadDataResolve();
      }
      Module['addRunDependency']('datafile_build/tileset-GiantDays.data');

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
    loadPackage({"files": [{"filename": "/gfx/GiantDays/cursor.png", "start": 0, "end": 126}, {"filename": "/gfx/GiantDays/fallback.png", "start": 126, "end": 122863}, {"filename": "/gfx/GiantDays/items.png", "start": 122863, "end": 253332}, {"filename": "/gfx/GiantDays/large.png", "start": 253332, "end": 295261}, {"filename": "/gfx/GiantDays/layering.json", "start": 295261, "end": 296113}, {"filename": "/gfx/GiantDays/mobs.png", "start": 296113, "end": 353333}, {"filename": "/gfx/GiantDays/tile_config.json", "start": 353333, "end": 863027}, {"filename": "/gfx/GiantDays/tiles.png", "start": 863027, "end": 943838}], "remote_package_size": 598187});

  });
}
// END the loadDataFile function
