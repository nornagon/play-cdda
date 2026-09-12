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
        var compressedData = {"data":null,"cachedOffset":675728,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2048,4101,6158,8206,10254,12302,14350,16398,18446,20494,22542,24590,26638,28686,30734,32782,34830,36878,38926,40974,43022,45070,47118,49166,51214,53262,55310,57366,59414,61462,63510,65558,67606,69654,71702,73750,75807,77855,79903,81951,83999,86047,88095,90143,92200,94248,96296,98344,100392,102440,104488,106536,108584,110639,112687,114735,116783,118831,120879,122927,124975,127028,129076,131124,133172,135220,137268,139316,141218,143211,145255,147289,149339,151380,153332,155379,157436,159484,161539,163579,165636,167684,169732,171780,173828,175876,177924,179972,182020,184068,186116,188173,190229,192285,194261,196235,198106,200145,202134,204039,206037,208093,210150,212207,214255,216064,218016,220050,222062,224110,226163,228213,230261,232316,234364,236412,238460,240508,242564,244618,246666,248714,250762,252810,254858,256906,258954,261002,263050,265098,267146,269194,271250,273298,275346,277394,279442,281490,283538,285592,287643,289691,291748,293796,295844,297891,299946,301994,304042,306090,308138,310186,312234,314282,316333,318381,320419,322470,324523,326556,328528,330577,332626,334664,336701,338739,340782,342781,344817,346831,348867,350904,352783,354723,356770,358806,360851,362833,364761,366818,368874,370892,372941,374998,377046,379094,381143,383156,385204,387252,389306,391336,393375,395318,397302,399350,401406,403429,405309,407226,408986,411034,413082,415135,417180,419228,421276,423324,425372,427424,429472,431522,433552,435594,437637,439688,441744,443789,445837,447889,449937,451994,454049,456097,458153,460187,462201,464247,466295,468350,470398,472454,474502,476515,478403,480451,482499,484555,486603,488653,490701,492749,494797,496845,498893,500941,502989,505037,507085,509003,510962,512856,514908,516894,518896,520852,522841,524876,526895,528943,530886,532934,534768,536737,538675,540727,542781,544829,546877,548925,550973,553021,555069,557117,559165,561213,563248,565296,567324,569374,571422,573478,575535,577591,579603,581645,583693,585733,587647,589702,591759,593105,593764,594495,595124,595724,596249,596972,597644,598380,599150,599823,600499,601100,601753,602375,603008,603679,604287,604903,605495,606111,606758,607465,608157,608877,609524,610188,610865,611491,612119,612717,613373,613978,614614,615238,615891,616455,617068,617670,618293,618924,619566,620154,620735,621371,622086,622728,623369,624007,624724,625340,626071,626769,627420,628079,628758,629443,630095,630786,631441,632058,632669,633247,633885,634550,635196,635797,636549,637139,637730,638407,639059,639782,640455,641071,641729,642282,642876,643424,644086,644706,645432,646110,646773,647434,648070,648703,649416,650083,650713,651335,652005,652650,653288,653944,654555,655208,655909,656572,657266,657931,658623,659378,659999,660697,661364,661955,662575,663168,663792,664305,664847,665531,666220,666807,667431,668180,668729,669292,669928,670592,671257,671951,672604,673274,673925,674614,675273],"sizes":[2048,2053,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2056,2048,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2048,2055,2048,2048,2048,2048,2048,2048,2048,2053,2048,2048,2048,2048,2048,2048,1902,1993,2044,2034,2050,2041,1952,2047,2057,2048,2055,2040,2057,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2057,2056,2056,1976,1974,1871,2039,1989,1905,1998,2056,2057,2057,2048,1809,1952,2034,2012,2048,2053,2050,2048,2055,2048,2048,2048,2048,2056,2054,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2056,2048,2048,2048,2048,2048,2048,2054,2051,2048,2057,2048,2048,2047,2055,2048,2048,2048,2048,2048,2048,2048,2051,2048,2038,2051,2053,2033,1972,2049,2049,2038,2037,2038,2043,1999,2036,2014,2036,2037,1879,1940,2047,2036,2045,1982,1928,2057,2056,2018,2049,2057,2048,2048,2049,2013,2048,2048,2054,2030,2039,1943,1984,2048,2056,2023,1880,1917,1760,2048,2048,2053,2045,2048,2048,2048,2048,2052,2048,2050,2030,2042,2043,2051,2056,2045,2048,2052,2048,2057,2055,2048,2056,2034,2014,2046,2048,2055,2048,2056,2048,2013,1888,2048,2048,2056,2048,2050,2048,2048,2048,2048,2048,2048,2048,2048,2048,1918,1959,1894,2052,1986,2002,1956,1989,2035,2019,2048,1943,2048,1834,1969,1938,2052,2054,2048,2048,2048,2048,2048,2048,2048,2048,2048,2035,2048,2028,2050,2048,2056,2057,2056,2012,2042,2048,2040,1914,2055,2057,1346,659,731,629,600,525,723,672,736,770,673,676,601,653,622,633,671,608,616,592,616,647,707,692,720,647,664,677,626,628,598,656,605,636,624,653,564,613,602,623,631,642,588,581,636,715,642,641,638,717,616,731,698,651,659,679,685,652,691,655,617,611,578,638,665,646,601,752,590,591,677,652,723,673,616,658,553,594,548,662,620,726,678,663,661,636,633,713,667,630,622,670,645,638,656,611,653,701,663,694,665,692,755,621,698,667,591,620,593,624,513,542,684,689,587,624,749,549,563,636,664,665,694,653,670,651,689,659,455],"successes":[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,0,0,1,1,1,1,1,0,1,1,1,1,1,0,0,1,1,0,0,0,0,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
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
    loadPackage({"files": [{"filename": "/gfx/SurveyorsMap/fallback.png", "start": 0, "end": 140692}, {"filename": "/gfx/SurveyorsMap/overmap.png", "start": 140692, "end": 591075}, {"filename": "/gfx/SurveyorsMap/overmap_tall.png", "start": 591075, "end": 596714}, {"filename": "/gfx/SurveyorsMap/tile_config.json", "start": 596714, "end": 859329}], "remote_package_size": 679824});

  });
}
// END the loadDataFile function
