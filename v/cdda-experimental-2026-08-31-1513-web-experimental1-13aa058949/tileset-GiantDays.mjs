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
        var compressedData = {"data":null,"cachedOffset":594090,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,1718,2016,3747,5795,7843,9891,11939,13987,16035,18083,20131,22179,24227,26275,28323,30371,32419,34467,36515,38563,40611,42659,44707,46755,48803,50851,52899,54947,56995,59043,61091,63139,65187,67235,69283,71331,73379,75427,77475,79523,81571,83619,85667,87715,89763,91811,93859,95907,97955,100003,102051,104099,106147,108195,110243,112291,114339,116387,118435,120483,122540,124597,126650,128703,130751,132799,134847,136895,138952,141000,143055,145103,147151,149199,151247,153297,155345,157393,159441,161489,163537,165585,167633,169681,171719,173767,175815,177866,179914,181963,184018,186069,188107,189959,191972,194028,196085,198133,200181,202229,204277,206325,208373,210421,212469,214517,216565,218613,220661,222709,224757,226797,228832,230881,232932,234979,237032,239071,241119,243167,245215,247263,249311,251359,253368,255393,257445,259501,261554,263588,265514,267169,269168,271225,273278,275296,277108,278794,280524,282538,284543,286538,288534,290307,291676,293667,295656,297681,299582,301498,303366,305292,307313,309336,311391,313439,315442,317493,319541,321566,323614,325662,327710,329758,331806,333862,335910,337958,340006,342054,344111,346159,347771,348300,348825,349352,349994,350511,351169,351832,352676,353505,354397,355175,355886,356591,357273,357878,358553,359206,359806,360507,361206,361916,362515,363207,363901,364726,365341,366123,366951,367662,368354,368899,369576,370276,371002,371672,372271,372766,373375,373968,374497,375093,375891,376672,377167,377584,378138,378613,379099,379579,380180,380668,381134,381537,382059,382527,382943,383403,383977,384434,384817,385211,385677,386213,386653,387047,387555,388021,388378,388793,389205,389602,389950,390284,391046,391801,392556,393255,394023,394715,395431,396062,396852,397498,398105,398627,399141,399625,400145,400624,401131,401669,402159,402673,403234,403745,404258,404807,405278,405785,406323,406822,407336,407929,408557,409463,410209,410975,411663,412478,413079,413653,414184,414832,415419,415993,416717,417397,418023,418650,419369,420025,420725,421334,422161,423047,423867,424641,425424,426281,427008,427833,428685,429494,430272,431017,431860,432694,433580,434354,435239,436131,437025,437872,438740,439572,440311,441021,441779,442573,443423,444323,445057,445827,446601,447207,447905,448447,449162,449867,450725,451423,452103,452978,453869,454818,455662,456460,457197,458051,458828,459678,460511,461378,462218,463172,464055,464857,465726,466576,467431,468310,469148,470069,471041,471657,472545,473292,474161,474939,475836,476663,477554,478245,479041,479824,480586,481331,481999,482746,483453,484202,484992,485694,486483,487278,488045,488777,489488,490239,490994,491743,492812,493527,494005,494482,494961,495456,495936,496480,497001,497492,498130,498661,499235,499815,500412,500988,501558,502093,502666,503220,503771,504332,504946,505598,506226,506791,507379,507986,508565,509293,510017,510620,511138,511666,512243,512793,513486,514982,517030,519078,521126,523174,525228,527239,529287,531344,533392,535440,537493,539541,541577,543509,545541,547505,549458,551459,553516,555516,557516,559564,561612,563667,565724,567772,569812,571862,573908,575956,578004,580055,582103,584160,586208,588256,590300,592348],"sizes":[1718,298,1731,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2057,2057,2053,2053,2048,2048,2048,2048,2057,2048,2055,2048,2048,2048,2048,2050,2048,2048,2048,2048,2048,2048,2048,2048,2038,2048,2048,2051,2048,2049,2055,2051,2038,1852,2013,2056,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2040,2035,2049,2051,2047,2053,2039,2048,2048,2048,2048,2048,2048,2009,2025,2052,2056,2053,2034,1926,1655,1999,2057,2053,2018,1812,1686,1730,2014,2005,1995,1996,1773,1369,1991,1989,2025,1901,1916,1868,1926,2021,2023,2055,2048,2003,2051,2048,2025,2048,2048,2048,2048,2048,2056,2048,2048,2048,2048,2057,2048,1612,529,525,527,642,517,658,663,844,829,892,778,711,705,682,605,675,653,600,701,699,710,599,692,694,825,615,782,828,711,692,545,677,700,726,670,599,495,609,593,529,596,798,781,495,417,554,475,486,480,601,488,466,403,522,468,416,460,574,457,383,394,466,536,440,394,508,466,357,415,412,397,348,334,762,755,755,699,768,692,716,631,790,646,607,522,514,484,520,479,507,538,490,514,561,511,513,549,471,507,538,499,514,593,628,906,746,766,688,815,601,574,531,648,587,574,724,680,626,627,719,656,700,609,827,886,820,774,783,857,727,825,852,809,778,745,843,834,886,774,885,892,894,847,868,832,739,710,758,794,850,900,734,770,774,606,698,542,715,705,858,698,680,875,891,949,844,798,737,854,777,850,833,867,840,954,883,802,869,850,855,879,838,921,972,616,888,747,869,778,897,827,891,691,796,783,762,745,668,747,707,749,790,702,789,795,767,732,711,751,755,749,1069,715,478,477,479,495,480,544,521,491,638,531,574,580,597,576,570,535,573,554,551,561,614,652,628,565,588,607,579,728,724,603,518,528,577,550,693,1496,2048,2048,2048,2048,2054,2011,2048,2057,2048,2048,2053,2048,2036,1932,2032,1964,1953,2001,2057,2000,2000,2048,2048,2055,2057,2048,2040,2050,2046,2048,2048,2051,2048,2057,2048,2048,2044,2048,1742],"successes":[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,0,1,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,0,1,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,0,0,0,0,0,1,0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,0,1,0,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,0,0,1,0,1]}
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
    loadPackage({"files": [{"filename": "/gfx/GiantDays/cursor.png", "start": 0, "end": 126}, {"filename": "/gfx/GiantDays/fallback.png", "start": 126, "end": 122863}, {"filename": "/gfx/GiantDays/items.png", "start": 122863, "end": 253332}, {"filename": "/gfx/GiantDays/large.png", "start": 253332, "end": 295261}, {"filename": "/gfx/GiantDays/layering.json", "start": 295261, "end": 296113}, {"filename": "/gfx/GiantDays/mobs.png", "start": 296113, "end": 353333}, {"filename": "/gfx/GiantDays/tile_config.json", "start": 353333, "end": 863027}, {"filename": "/gfx/GiantDays/tiles.png", "start": 863027, "end": 943838}], "remote_package_size": 598186});

  });
}
// END the loadDataFile function
