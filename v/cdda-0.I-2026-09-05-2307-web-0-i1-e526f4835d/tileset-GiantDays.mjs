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
        var compressedData = {"data":null,"cachedOffset":593956,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,1719,2017,3748,5796,7844,9892,11940,13988,16036,18084,20132,22180,24228,26276,28324,30372,32420,34468,36516,38564,40612,42660,44708,46756,48804,50852,52900,54948,56996,59044,61092,63140,65188,67236,69284,71332,73380,75428,77476,79524,81572,83620,85668,87716,89764,91812,93860,95908,97956,100004,102052,104100,106148,108196,110244,112292,114340,116388,118436,120484,122541,124598,126651,128704,130752,132800,134848,136896,138953,141001,143056,145104,147152,149200,151248,153298,155346,157394,159442,161490,163538,165586,167634,169682,171720,173768,175816,177867,179915,181964,184019,186070,188108,189960,191973,194029,196086,198134,200182,202230,204278,206326,208374,210422,212470,214518,216566,218614,220662,222710,224758,226798,228833,230882,232933,234980,237033,239072,241120,243168,245216,247264,249312,251360,253369,255394,257446,259502,261555,263589,265515,267170,269169,271226,273279,275297,277109,278795,280525,282539,284544,286539,288535,290308,291677,293668,295657,297682,299583,301499,303367,305293,307314,309337,311392,313440,315446,317487,319535,321560,323617,325672,327720,329777,331825,333881,335929,337984,340032,342080,344128,346176,347782,348307,348834,349359,350005,350516,351176,351836,352683,353520,354412,355190,355900,356601,357278,357887,358562,359210,359815,360514,361211,361923,362520,363214,363901,364720,365333,366114,366941,367645,368331,368877,369554,370248,370974,371641,372243,372740,373354,373946,374485,375078,375881,376663,377162,377581,378142,378616,379097,379583,380177,380661,381124,381532,382051,382514,382925,383383,383953,384412,384792,385188,385651,386170,386616,387009,387514,387980,388350,388760,389173,389570,389912,390240,390998,391759,392511,393213,393985,394673,395392,396022,396811,397459,398069,398591,399103,399588,400105,400591,401094,401628,402114,402633,403193,403701,404219,404766,405239,405746,406286,406790,407305,407891,408521,409420,410167,410925,411620,412435,413035,413604,414137,414783,415374,415945,416670,417347,417963,418593,419315,419970,420667,421274,422092,422969,423799,424575,425374,426229,426950,427766,428605,429414,430189,430937,431785,432608,433492,434268,435154,436049,436945,437794,438656,439493,440236,440944,441713,442504,443357,444258,444986,445754,446527,447137,447834,448379,449098,449808,450674,451378,452061,452927,453808,454755,455602,456389,457113,457960,458739,459593,460426,461302,462140,463088,463975,464768,465634,466467,467319,468199,469044,469977,470945,471580,472474,473224,474090,474877,475783,476607,477490,478188,478981,479765,480523,481266,481932,482672,483377,484131,484919,485620,486403,487202,487971,488707,489412,490170,490923,491663,492721,493436,493913,494397,494872,495372,495845,496385,496907,497400,498050,498585,499161,499748,500347,500925,501501,502036,502608,503158,503709,504276,504885,505535,506158,506720,507302,507900,508474,509226,509946,510555,511068,511595,512172,512720,513416,514915,516963,519011,521059,523107,525152,527163,529211,531259,533307,535355,537409,539457,541495,543424,545454,547418,549371,551372,553420,555412,557412,559460,561508,563563,565611,567662,569702,571750,573794,575842,577894,579942,581990,584038,586086,588134,590178,592226],"sizes":[1719,298,1731,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2057,2057,2053,2053,2048,2048,2048,2048,2057,2048,2055,2048,2048,2048,2048,2050,2048,2048,2048,2048,2048,2048,2048,2048,2038,2048,2048,2051,2048,2049,2055,2051,2038,1852,2013,2056,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2040,2035,2049,2051,2047,2053,2039,2048,2048,2048,2048,2048,2048,2009,2025,2052,2056,2053,2034,1926,1655,1999,2057,2053,2018,1812,1686,1730,2014,2005,1995,1996,1773,1369,1991,1989,2025,1901,1916,1868,1926,2021,2023,2055,2048,2006,2041,2048,2025,2057,2055,2048,2057,2048,2056,2048,2055,2048,2048,2048,2048,1606,525,527,525,646,511,660,660,847,837,892,778,710,701,677,609,675,648,605,699,697,712,597,694,687,819,613,781,827,704,686,546,677,694,726,667,602,497,614,592,539,593,803,782,499,419,561,474,481,486,594,484,463,408,519,463,411,458,570,459,380,396,463,519,446,393,505,466,370,410,413,397,342,328,758,761,752,702,772,688,719,630,789,648,610,522,512,485,517,486,503,534,486,519,560,508,518,547,473,507,540,504,515,586,630,899,747,758,695,815,600,569,533,646,591,571,725,677,616,630,722,655,697,607,818,877,830,776,799,855,721,816,839,809,775,748,848,823,884,776,886,895,896,849,862,837,743,708,769,791,853,901,728,768,773,610,697,545,719,710,866,704,683,866,881,947,847,787,724,847,779,854,833,876,838,948,887,793,866,833,852,880,845,933,968,635,894,750,866,787,906,824,883,698,793,784,758,743,666,740,705,754,788,701,783,799,769,736,705,758,753,740,1058,715,477,484,475,500,473,540,522,493,650,535,576,587,599,578,576,535,572,550,551,567,609,650,623,562,582,598,574,752,720,609,513,527,577,548,696,1499,2048,2048,2048,2048,2045,2011,2048,2048,2048,2048,2054,2048,2038,1929,2030,1964,1953,2001,2048,1992,2000,2048,2048,2055,2048,2051,2040,2048,2044,2048,2052,2048,2048,2048,2048,2048,2044,2048,1730],"successes":[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,0,1,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,0,1,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,0,1,0,1,0,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,0,0,0,0,1,0,1,1,1,1,1,1,0,1,1,1,0,1,0,1,1,0,1,0,1,0,0,0,0,0,1,0,1]}
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
    loadPackage({"files": [{"filename": "/gfx/GiantDays/cursor.png", "start": 0, "end": 126}, {"filename": "/gfx/GiantDays/fallback.png", "start": 126, "end": 122863}, {"filename": "/gfx/GiantDays/items.png", "start": 122863, "end": 253332}, {"filename": "/gfx/GiantDays/large.png", "start": 253332, "end": 295261}, {"filename": "/gfx/GiantDays/layering.json", "start": 295261, "end": 296113}, {"filename": "/gfx/GiantDays/mobs.png", "start": 296113, "end": 353328}, {"filename": "/gfx/GiantDays/tile_config.json", "start": 353328, "end": 863015}, {"filename": "/gfx/GiantDays/tiles.png", "start": 863015, "end": 943826}], "remote_package_size": 598052});

  });
}
// END the loadDataFile function
