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
      var PACKAGE_NAME = 'build/tileset-Cuteclysm.data';
      var REMOTE_PACKAGE_BASE = 'tileset-Cuteclysm.data';
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
Module['FS_createPath']("/gfx", "Cuteclysm", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        var compressedData = {"data":null,"cachedOffset":776850,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2056,4102,6043,8094,10138,12193,14241,16289,18337,20262,22318,24366,26414,28462,30510,32558,34606,36532,38569,40614,42669,44717,46765,48813,50861,52909,54957,57005,59053,61101,63149,65206,67262,69307,71355,73403,75451,77499,79529,81577,83632,85680,87727,89782,91725,93691,95739,97787,99835,101883,103938,105980,108028,110076,112124,114172,116219,118276,120151,122199,124256,126304,128352,130400,132446,134472,136520,138568,140620,142668,144670,146617,148665,150713,152761,154809,156857,158906,160952,163000,165048,167104,169155,171118,173168,175222,177267,179315,181363,183418,185463,187502,189550,191606,193654,195679,197593,199641,201689,203737,205785,207842,209889,211913,213961,216009,218061,220118,222115,224071,226127,228175,230223,232271,234323,236374,238420,240477,242531,244579,246627,248551,250599,252647,254695,256743,258791,260842,262884,264923,266971,269025,271073,273100,275054,277102,279150,281198,283255,285306,287356,289404,291452,293500,295548,297604,299553,301605,303653,305701,307749,309797,311848,313895,315939,317994,320051,322099,324144,326081,328129,330177,332233,334281,336329,338372,340397,342445,344493,346547,348600,350624,352579,354627,356675,358723,360780,362823,364866,366916,368973,371029,373077,375125,377102,379140,381188,383236,385284,387332,389386,391428,393471,395523,397578,399626,401681,403604,405652,407700,409748,411796,413853,415902,417926,419974,422022,424074,426129,428132,430097,432154,434202,436250,438298,440352,442400,444448,446496,448544,450592,452640,454614,456661,458709,460757,462805,464853,466905,468948,470988,473036,475093,477141,479183,481103,483159,485207,487255,489303,491351,493399,495445,497482,499533,501572,503627,505675,507723,509771,511819,513867,515915,517971,520019,522068,524116,526164,528212,530260,532308,534356,536404,538452,540509,542566,544601,546576,548624,550672,552723,554756,556696,558632,560593,562590,564580,566479,568446,570458,572469,574453,576453,578459,580468,582458,584419,586372,588168,590072,592077,594055,596036,598003,599864,601766,603732,605693,607634,609561,611587,613593,615555,617467,619391,621289,623287,625339,627391,629421,631469,633525,635567,637615,639663,641713,643761,645706,647762,649810,651866,653920,655955,658003,659884,661707,663498,665286,667298,669273,671118,673093,675014,676714,678273,680235,682275,684246,685557,687367,688612,689858,691703,693629,694395,695082,695635,696383,697049,697814,698520,699205,699869,700455,701102,701760,702608,703374,704096,704916,705496,705839,706211,706689,707137,707575,707915,708249,708603,708941,709363,709837,710333,710847,711274,711756,712222,712718,713206,713707,714192,714694,715166,715654,716081,716574,716882,717338,717757,718288,718762,719268,719725,720163,720578,721085,721568,722068,722545,722949,723228,723664,724182,724686,725150,725659,726151,726625,727074,727525,727962,728452,728887,729311,729681,730154,730619,731157,731544,731957,732454,732930,733355,733780,734231,734605,735040,735517,736000,736477,736848,737306,737741,738211,738639,739023,739454,739897,740354,740756,741184,741615,742046,742550,743030,743455,743881,744304,744762,745191,745640,746108,746504,746969,747425,747824,748258,748728,749165,749600,750041,750827,751253,751550,751948,752336,752720,753027,753397,753771,754227,754539,754952,755322,755638,755910,756172,756680,757286,757684,757940,758228,758490,758714,758949,759396,759869,760485,760927,761184,761564,762191,762685,763333,763795,764209,764597,765055,765350,766072,766702,767261,767726,768381,769106,769859,770413,771136,771777,772454,773455,775396],"sizes":[2056,2046,1941,2051,2044,2055,2048,2048,2048,1925,2056,2048,2048,2048,2048,2048,2048,1926,2037,2045,2055,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2057,2056,2045,2048,2048,2048,2048,2030,2048,2055,2048,2047,2055,1943,1966,2048,2048,2048,2048,2055,2042,2048,2048,2048,2048,2047,2057,1875,2048,2057,2048,2048,2048,2046,2026,2048,2048,2052,2048,2002,1947,2048,2048,2048,2048,2048,2049,2046,2048,2048,2056,2051,1963,2050,2054,2045,2048,2048,2055,2045,2039,2048,2056,2048,2025,1914,2048,2048,2048,2048,2057,2047,2024,2048,2048,2052,2057,1997,1956,2056,2048,2048,2048,2052,2051,2046,2057,2054,2048,2048,1924,2048,2048,2048,2048,2048,2051,2042,2039,2048,2054,2048,2027,1954,2048,2048,2048,2057,2051,2050,2048,2048,2048,2048,2056,1949,2052,2048,2048,2048,2048,2051,2047,2044,2055,2057,2048,2045,1937,2048,2048,2056,2048,2048,2043,2025,2048,2048,2054,2053,2024,1955,2048,2048,2048,2057,2043,2043,2050,2057,2056,2048,2048,1977,2038,2048,2048,2048,2048,2054,2042,2043,2052,2055,2048,2055,1923,2048,2048,2048,2048,2057,2049,2024,2048,2048,2052,2055,2003,1965,2057,2048,2048,2048,2054,2048,2048,2048,2048,2048,2048,1974,2047,2048,2048,2048,2048,2052,2043,2040,2048,2057,2048,2042,1920,2056,2048,2048,2048,2048,2048,2046,2037,2051,2039,2055,2048,2048,2048,2048,2048,2048,2056,2048,2049,2048,2048,2048,2048,2048,2048,2048,2048,2057,2057,2035,1975,2048,2048,2051,2033,1940,1936,1961,1997,1990,1899,1967,2012,2011,1984,2000,2006,2009,1990,1961,1953,1796,1904,2005,1978,1981,1967,1861,1902,1966,1961,1941,1927,2026,2006,1962,1912,1924,1898,1998,2052,2052,2030,2048,2056,2042,2048,2048,2050,2048,1945,2056,2048,2056,2054,2035,2048,1881,1823,1791,1788,2012,1975,1845,1975,1921,1700,1559,1962,2040,1971,1311,1810,1245,1246,1845,1926,766,687,553,748,666,765,706,685,664,586,647,658,848,766,722,820,580,343,372,478,448,438,340,334,354,338,422,474,496,514,427,482,466,496,488,501,485,502,472,488,427,493,308,456,419,531,474,506,457,438,415,507,483,500,477,404,279,436,518,504,464,509,492,474,449,451,437,490,435,424,370,473,465,538,387,413,497,476,425,425,451,374,435,477,483,477,371,458,435,470,428,384,431,443,457,402,428,431,431,504,480,425,426,423,458,429,449,468,396,465,456,399,434,470,437,435,441,786,426,297,398,388,384,307,370,374,456,312,413,370,316,272,262,508,606,398,256,288,262,224,235,447,473,616,442,257,380,627,494,648,462,414,388,458,295,722,630,559,465,655,725,753,554,723,641,677,1001,1941,1454],"successes":[1,1,1,1,1,1,0,0,0,1,1,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,0,1,0,1,1,1,1,0,0,0,0,1,1,0,0,0,0,1,1,1,0,1,0,0,0,1,1,0,0,1,0,1,1,0,0,0,0,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,0,1,0,1,1,0,0,0,0,1,1,1,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,1,0,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,1,0,0,0,1,1,1,0,0,0,0,1,1,1,1,1,0,1,1,0,0,1,0,0,1,1,0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,1,1,0,0,0,0,1,1,1,1,1,0,1,1,0,0,0,0,1,1,1,0,0,1,1,1,1,1,0,0,0,1,1,1,0,0,0,0,1,1,0,0,0,0,1,1,1,0,1,0,1,1,1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
;
            compressedData['data'] = byteArray;
            assert(typeof Module['LZ4'] === 'object', 'LZ4 not present - was your app build with -sLZ4?');
            await Module['LZ4'].loadPackage({ 'metadata': metadata, 'compressedData': compressedData }, false);
            Module['removeRunDependency']('datafile_build/tileset-Cuteclysm.data');
loadDataResolve();
      }
      Module['addRunDependency']('datafile_build/tileset-Cuteclysm.data');

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
    loadPackage({"files": [{"filename": "/gfx/Cuteclysm/backdrop.png", "start": 0, "end": 27692}, {"filename": "/gfx/Cuteclysm/backdropoffset.png", "start": 27692, "end": 30345}, {"filename": "/gfx/Cuteclysm/creatures.png", "start": 30345, "end": 66086}, {"filename": "/gfx/Cuteclysm/expandedcreatures.png", "start": 66086, "end": 70296}, {"filename": "/gfx/Cuteclysm/fallback.png", "start": 70296, "end": 486266}, {"filename": "/gfx/Cuteclysm/fields.png", "start": 486266, "end": 488215}, {"filename": "/gfx/Cuteclysm/fillerItems.png", "start": 488215, "end": 556826}, {"filename": "/gfx/Cuteclysm/fillerVehicles.png", "start": 556826, "end": 626541}, {"filename": "/gfx/Cuteclysm/hugebackdrop.png", "start": 626541, "end": 637338}, {"filename": "/gfx/Cuteclysm/items.png", "start": 637338, "end": 650771}, {"filename": "/gfx/Cuteclysm/overlayoffset.png", "start": 650771, "end": 651016}, {"filename": "/gfx/Cuteclysm/overmap.png", "start": 651016, "end": 655958}, {"filename": "/gfx/Cuteclysm/tallbackdrop.png", "start": 655958, "end": 702680}, {"filename": "/gfx/Cuteclysm/tallexpandedcreatures.png", "start": 702680, "end": 704137}, {"filename": "/gfx/Cuteclysm/tile_config.json", "start": 704137, "end": 1046224}, {"filename": "/gfx/Cuteclysm/ui.png", "start": 1046224, "end": 1047979}, {"filename": "/gfx/Cuteclysm/ultratallbackdrop.png", "start": 1047979, "end": 1050282}], "remote_package_size": 780946});

  });
}
// END the loadDataFile function
