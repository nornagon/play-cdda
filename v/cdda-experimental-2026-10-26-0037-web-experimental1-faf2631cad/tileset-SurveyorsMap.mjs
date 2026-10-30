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
      var PACKAGE_NAME = 'build/tileset-SurveyorsMap.data';
      var REMOTE_PACKAGE_BASE = 'tileset-SurveyorsMap.data';
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
Module['FS_createPath']("/gfx", "SurveyorsMap", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        var compressedData = {"data":null,"cachedOffset":675678,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2048,4101,6158,8206,10254,12302,14350,16398,18446,20494,22542,24590,26638,28686,30734,32782,34830,36878,38926,40974,43022,45070,47118,49166,51214,53262,55310,57366,59414,61462,63510,65558,67606,69654,71702,73750,75807,77855,79903,81951,83999,86047,88095,90143,92200,94248,96296,98344,100392,102440,104488,106536,108584,110639,112687,114735,116783,118831,120879,122927,124975,127028,129076,131124,133172,135220,137268,139316,141215,143204,145253,147289,149337,151377,153331,155374,157431,159479,161536,163576,165631,167679,169727,171775,173823,175871,177919,179967,182024,184072,186120,188169,190224,192281,194261,196237,198104,200137,202130,204035,206036,208092,210144,212192,214249,216053,218014,220048,222066,224114,226163,228212,230269,232317,234372,236420,238468,240516,242573,244626,246674,248722,250770,252818,254866,256914,258971,261019,263067,265115,267163,269220,271277,273325,275381,277429,279477,281525,283573,285621,287675,289731,291788,293836,295884,297932,299988,302044,304092,306148,308196,310244,312301,314349,316401,318449,320485,322540,324592,326625,328595,330651,332701,334737,336775,338814,340858,342855,344893,346910,348945,350984,352862,354803,356851,358886,360928,362910,364835,366883,368939,370958,373007,375063,377111,379159,381211,383221,385269,387317,389361,391388,393432,395374,397380,399428,401484,403507,405385,407303,409062,411110,413158,415211,417260,419308,421356,423404,425452,427503,429559,431608,433632,435673,437711,439763,441820,443867,445915,447967,450016,452064,454120,456168,458223,460258,462280,464327,466375,468428,470485,472533,474581,476587,478477,480525,482573,484628,486676,488729,490777,492825,494873,496921,498969,501017,503065,505113,507168,509092,511055,512952,515001,516986,518987,520946,522932,524967,526983,529031,530972,533020,534841,536829,538761,540811,542868,544916,546964,549001,551049,553097,555145,557193,559241,561289,563331,565375,567401,569453,571503,573551,575599,577647,579660,581701,583758,585799,587706,589762,591810,593086,593744,594451,595084,595683,596202,596925,597585,598300,599062,599743,600426,601017,601665,602289,602916,603597,604223,604835,605427,606060,606730,607448,608130,608841,609492,610133,610813,611428,612044,612636,613294,613895,614533,615165,615802,616375,616969,617578,618189,618814,619460,620035,620617,621268,621984,622618,623263,623905,624615,625223,625964,626672,627326,627987,628662,629335,630002,630682,631358,631983,632588,633154,633793,634468,635102,635712,636472,637063,637657,638331,638985,639705,640396,641004,641666,642222,642817,643378,644038,644643,645369,646047,646704,647375,648005,648641,649364,650014,650643,651284,651933,652580,653222,653881,654498,655173,655847,656512,657204,657866,658561,659322,659938,660646,661324,661912,662531,663129,663748,664249,664797,665489,666174,666769,667405,668146,668697,669277,669904,670579,671240,671923,672565,673243,673906,674585,675238],"sizes":[2048,2053,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2056,2048,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2048,2055,2048,2048,2048,2048,2048,2048,2048,2053,2048,2048,2048,2048,2048,2048,1899,1989,2049,2036,2048,2040,1954,2043,2057,2048,2057,2040,2055,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2049,2055,2057,1980,1976,1867,2033,1993,1905,2001,2056,2052,2048,2057,1804,1961,2034,2018,2048,2049,2049,2057,2048,2055,2048,2048,2048,2057,2053,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2057,2057,2048,2056,2048,2048,2048,2048,2048,2054,2056,2057,2048,2048,2048,2056,2056,2048,2056,2048,2048,2057,2048,2052,2048,2036,2055,2052,2033,1970,2056,2050,2036,2038,2039,2044,1997,2038,2017,2035,2039,1878,1941,2048,2035,2042,1982,1925,2048,2056,2019,2049,2056,2048,2048,2052,2010,2048,2048,2044,2027,2044,1942,2006,2048,2056,2023,1878,1918,1759,2048,2048,2053,2049,2048,2048,2048,2048,2051,2056,2049,2024,2041,2038,2052,2057,2047,2048,2052,2049,2048,2056,2048,2055,2035,2022,2047,2048,2053,2057,2048,2048,2006,1890,2048,2048,2055,2048,2053,2048,2048,2048,2048,2048,2048,2048,2048,2055,1924,1963,1897,2049,1985,2001,1959,1986,2035,2016,2048,1941,2048,1821,1988,1932,2050,2057,2048,2048,2037,2048,2048,2048,2048,2048,2048,2042,2044,2026,2052,2050,2048,2048,2048,2013,2041,2057,2041,1907,2056,2048,1276,658,707,633,599,519,723,660,715,762,681,683,591,648,624,627,681,626,612,592,633,670,718,682,711,651,641,680,615,616,592,658,601,638,632,637,573,594,609,611,625,646,575,582,651,716,634,645,642,710,608,741,708,654,661,675,673,667,680,676,625,605,566,639,675,634,610,760,591,594,674,654,720,691,608,662,556,595,561,660,605,726,678,657,671,630,636,723,650,629,641,649,647,642,659,617,675,674,665,692,662,695,761,616,708,678,588,619,598,619,501,548,692,685,595,636,741,551,580,627,675,661,683,642,678,663,679,653,440],"successes":[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,1,0,0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,0,0,0,1,1,0,0,0,0,0,0,1,0,0,0,0,1,1,0,1,0,0,0,0,0,1,1,1,0,0,1,1,1,0,1,0,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,0,1,1,0,0,1,1,1,1,1,0,1,1,1,1,1,0,0,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,0,1,0,1,1,1,1,0,1,1,0,0,1,1,0,0,1,0,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,0,0,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
;
            compressedData['data'] = byteArray;
            assert(typeof Module['LZ4'] === 'object', 'LZ4 not present - was your app build with -sLZ4?');
            await Module['LZ4'].loadPackage({ 'metadata': metadata, 'compressedData': compressedData }, false);
            Module['removeRunDependency']('datafile_build/tileset-SurveyorsMap.data');
loadDataResolve();
      }
      Module['addRunDependency']('datafile_build/tileset-SurveyorsMap.data');

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
    loadPackage({"files": [{"filename": "/gfx/SurveyorsMap/fallback.png", "start": 0, "end": 140692}, {"filename": "/gfx/SurveyorsMap/overmap.png", "start": 140692, "end": 591038}, {"filename": "/gfx/SurveyorsMap/overmap_tall.png", "start": 591038, "end": 596677}, {"filename": "/gfx/SurveyorsMap/tile_config.json", "start": 596677, "end": 859292}], "remote_package_size": 679774});

  });
}
// END the loadDataFile function
