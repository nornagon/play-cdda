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
        var compressedData = {"data":null,"cachedOffset":677897,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2048,4101,6158,8206,10254,12302,14350,16398,18446,20494,22542,24590,26638,28686,30734,32782,34830,36878,38926,40974,43022,45070,47118,49166,51214,53262,55310,57366,59414,61462,63510,65558,67606,69654,71702,73750,75807,77855,79903,81951,83999,86047,88095,90143,92200,94248,96296,98344,100392,102440,104488,106536,108584,110639,112687,114735,116783,118831,120879,122927,124975,127028,129076,131124,133172,135220,137268,139316,141218,143211,145255,147289,149339,151380,153332,155379,157436,159484,161539,163579,165636,167684,169732,171780,173828,175876,177924,179972,182020,184068,186116,188173,190229,192285,194261,196235,198106,200145,202134,204039,206037,208093,210150,212207,214255,216064,218016,220050,222062,224110,226163,228213,230261,232316,234364,236412,238460,240508,242564,244618,246666,248714,250762,252810,254858,256906,258954,261002,263050,265098,267146,269194,271250,273298,275346,277394,279442,281490,283538,285592,287643,289691,291748,293796,295844,297891,299946,301994,304042,306090,308138,310186,312234,314282,316333,318381,320419,322470,324523,326556,328528,330577,332626,334664,336701,338739,340782,342781,344817,346831,348867,350904,352783,354723,356770,358806,360851,362833,364761,366818,368874,370892,372941,374998,377046,379094,381143,383156,385204,387252,389306,391336,393375,395318,397302,399350,401406,403429,405309,407226,408986,411034,413082,415135,417180,419228,421276,423324,425372,427424,429472,431522,433552,435594,437637,439688,441744,443789,445837,447889,449939,451996,454052,456100,458156,460212,462260,464316,466360,468408,470464,472507,474555,476603,478588,480472,482520,484568,486615,488668,490716,492764,494812,496860,498908,500956,503004,505061,507116,509172,511069,513050,514989,517011,519012,521044,522980,524977,527012,529040,531088,533055,535103,536910,538922,540817,542865,544918,546966,549014,551062,553110,555158,557206,559254,561302,563350,565401,567435,569438,571489,573535,575583,577631,579678,581685,583692,585740,587785,589749,591801,593849,595368,596032,596720,597394,597989,598528,599211,599876,600592,601323,602001,602686,603300,603957,604555,605201,605841,606427,607057,607659,608288,608952,609640,610312,611028,611649,612304,612962,613624,614246,614848,615484,616086,616708,617345,617969,618528,619137,619737,620360,620974,621603,622229,622804,623423,624132,624760,625402,626030,626702,627363,628065,628773,629464,630109,630773,631432,632081,632744,633391,634013,634623,635222,635866,636581,637186,637767,638492,639138,639717,640385,641073,641762,642419,643074,643690,644222,644790,645358,646035,646629,647347,648012,648644,649321,649955,650579,651233,651944,652579,653194,653885,654556,655218,655840,656505,657137,657913,658485,659204,659850,660501,661285,661915,662533,663190,663778,664385,664976,665609,666185,666646,667314,667984,668691,669244,669978,670593,671090,671805,672443,673082,673778,674413,675104,675768,676427,677078,677792],"sizes":[2048,2053,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2056,2048,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2048,2055,2048,2048,2048,2048,2048,2048,2048,2053,2048,2048,2048,2048,2048,2048,1902,1993,2044,2034,2050,2041,1952,2047,2057,2048,2055,2040,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2057,2056,2056,1976,1974,1871,2039,1989,1905,1998,2056,2057,2057,2048,1809,1952,2034,2012,2048,2053,2050,2048,2055,2048,2048,2048,2048,2056,2054,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2056,2048,2048,2048,2048,2048,2048,2054,2051,2048,2057,2048,2048,2047,2055,2048,2048,2048,2048,2048,2048,2048,2051,2048,2038,2051,2053,2033,1972,2049,2049,2038,2037,2038,2043,1999,2036,2014,2036,2037,1879,1940,2047,2036,2045,1982,1928,2057,2056,2018,2049,2057,2048,2048,2049,2013,2048,2048,2054,2030,2039,1943,1984,2048,2056,2023,1880,1917,1760,2048,2048,2053,2045,2048,2048,2048,2048,2052,2048,2050,2030,2042,2043,2051,2056,2045,2048,2052,2050,2057,2056,2048,2056,2056,2048,2056,2044,2048,2056,2043,2048,2048,1985,1884,2048,2048,2047,2053,2048,2048,2048,2048,2048,2048,2048,2057,2055,2056,1897,1981,1939,2022,2001,2032,1936,1997,2035,2028,2048,1967,2048,1807,2012,1895,2048,2053,2048,2048,2048,2048,2048,2048,2048,2048,2048,2051,2034,2003,2051,2046,2048,2048,2047,2007,2007,2048,2045,1964,2052,2048,1519,664,688,674,595,539,683,665,716,731,678,685,614,657,598,646,640,586,630,602,629,664,688,672,716,621,655,658,662,622,602,636,602,622,637,624,559,609,600,623,614,629,626,575,619,709,628,642,628,672,661,702,708,691,645,664,659,649,663,647,622,610,599,644,715,605,581,725,646,579,668,688,689,657,655,616,532,568,568,677,594,718,665,632,677,634,624,654,711,635,615,691,671,662,622,665,632,776,572,719,646,651,784,630,618,657,588,607,591,633,576,461,668,670,707,553,734,615,497,715,638,639,696,635,691,664,659,651,714,105],"successes":[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,0,0,1,1,1,1,1,0,1,1,1,1,1,0,0,1,1,0,0,0,0,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,0,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
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
    loadPackage({"files": [{"filename": "/gfx/SurveyorsMap/fallback.png", "start": 0, "end": 140692}, {"filename": "/gfx/SurveyorsMap/overmap.png", "start": 140692, "end": 593433}, {"filename": "/gfx/SurveyorsMap/overmap_tall.png", "start": 593433, "end": 599072}, {"filename": "/gfx/SurveyorsMap/tile_config.json", "start": 599072, "end": 862366}], "remote_package_size": 681993});

  });
}
// END the loadDataFile function
