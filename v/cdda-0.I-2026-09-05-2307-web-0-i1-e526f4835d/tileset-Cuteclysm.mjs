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
        var compressedData = {"data":null,"cachedOffset":776636,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2056,4102,6043,8094,10138,12193,14241,16289,18337,20262,22318,24366,26414,28462,30510,32565,34613,36543,38579,40624,42672,44720,46768,48825,50873,52921,54969,57017,59065,61113,63161,65218,67274,69319,71367,73415,75463,77511,79541,81589,83644,85692,87739,89794,91737,93703,95751,97799,99847,101895,103950,105992,108040,110088,112136,114184,116231,118288,120163,122211,124268,126316,128364,130412,132458,134484,136532,138580,140632,142680,144682,146629,148677,150725,152773,154821,156869,158918,160964,163012,165060,167116,169167,171130,173180,175234,177279,179327,181375,183430,185475,187514,189562,191618,193666,195691,197605,199653,201701,203749,205797,207854,209901,211925,213973,216021,218073,220130,222127,224083,226139,228187,230235,232283,234335,236386,238432,240489,242543,244591,246639,248563,250611,252659,254707,256755,258803,260854,262896,264935,266983,269037,271085,273112,275066,277114,279162,281210,283267,285318,287368,289416,291464,293512,295560,297616,299565,301617,303665,305713,307761,309809,311860,313907,315951,318006,320063,322111,324156,326093,328141,330189,332245,334293,336341,338384,340409,342457,344505,346559,348612,350636,352591,354639,356687,358735,360792,362835,364878,366928,368985,371041,373089,375137,377114,379152,381200,383248,385296,387344,389398,391440,393483,395535,397590,399638,401693,403616,405664,407712,409760,411808,413865,415914,417938,419986,422034,424086,426141,428144,430109,432166,434214,436262,438310,440364,442412,444460,446508,448556,450604,452652,454626,456673,458721,460769,462817,464865,466917,468960,471000,473048,475105,477153,479195,481115,483171,485219,487267,489315,491363,493411,495457,497494,499545,501584,503639,505687,507735,509783,511831,513879,515927,517983,520031,522080,524128,526176,528224,530272,532320,534368,536416,538464,540521,542578,544613,546588,548636,550684,552735,554768,556708,558644,560605,562602,564592,566491,568458,570470,572481,574465,576465,578471,580480,582470,584431,586384,588180,590110,592114,594087,596063,598044,599906,601807,603770,605737,607674,609605,611632,613634,615607,617533,619460,621342,623338,625395,627444,629475,631522,633578,635625,637673,639721,641773,643821,645757,647805,649861,651911,653959,655984,658039,659878,661721,663494,665292,667304,669251,671114,673090,674994,676639,678243,680157,682205,684012,685368,687165,688462,689705,691619,693452,694195,694861,695425,696192,696875,697656,698331,699018,699617,700209,700842,701504,702346,703128,703852,704705,705238,705608,705968,706439,706890,707346,707686,708014,708388,708722,709156,709619,710132,710627,711046,711532,712012,712504,712997,713506,714002,714516,714985,715485,715915,716421,716754,717209,717653,718214,718654,719146,719608,720017,720445,720954,721440,721955,722400,722777,723069,723541,724024,724558,725010,725520,726023,726484,726940,727401,727847,728331,728764,729187,729563,730043,730524,731049,731437,731858,732370,732846,733262,733678,734119,734494,734937,735416,735898,736377,736726,737190,737615,738079,738506,738867,739310,739755,740195,740596,741024,741449,741875,742381,742861,743301,743712,744145,744607,745026,745484,745944,746349,746818,747282,747697,748127,748602,749048,749484,749918,750748,751165,751472,751878,752241,752612,752927,753296,753692,754153,754464,754878,755245,755560,755827,756090,756640,757213,757569,757816,758119,758363,758590,758834,759287,759773,760376,760798,761045,761437,762081,762554,763171,763597,764006,764417,764868,765167,765925,766562,767131,767584,768254,768839,769660,770202,770912,771568,772133,772894,774827,776502],"sizes":[2056,2046,1941,2051,2044,2055,2048,2048,2048,1925,2056,2048,2048,2048,2048,2055,2048,1930,2036,2045,2048,2048,2048,2057,2048,2048,2048,2048,2048,2048,2048,2057,2056,2045,2048,2048,2048,2048,2030,2048,2055,2048,2047,2055,1943,1966,2048,2048,2048,2048,2055,2042,2048,2048,2048,2048,2047,2057,1875,2048,2057,2048,2048,2048,2046,2026,2048,2048,2052,2048,2002,1947,2048,2048,2048,2048,2048,2049,2046,2048,2048,2056,2051,1963,2050,2054,2045,2048,2048,2055,2045,2039,2048,2056,2048,2025,1914,2048,2048,2048,2048,2057,2047,2024,2048,2048,2052,2057,1997,1956,2056,2048,2048,2048,2052,2051,2046,2057,2054,2048,2048,1924,2048,2048,2048,2048,2048,2051,2042,2039,2048,2054,2048,2027,1954,2048,2048,2048,2057,2051,2050,2048,2048,2048,2048,2056,1949,2052,2048,2048,2048,2048,2051,2047,2044,2055,2057,2048,2045,1937,2048,2048,2056,2048,2048,2043,2025,2048,2048,2054,2053,2024,1955,2048,2048,2048,2057,2043,2043,2050,2057,2056,2048,2048,1977,2038,2048,2048,2048,2048,2054,2042,2043,2052,2055,2048,2055,1923,2048,2048,2048,2048,2057,2049,2024,2048,2048,2052,2055,2003,1965,2057,2048,2048,2048,2054,2048,2048,2048,2048,2048,2048,1974,2047,2048,2048,2048,2048,2052,2043,2040,2048,2057,2048,2042,1920,2056,2048,2048,2048,2048,2048,2046,2037,2051,2039,2055,2048,2048,2048,2048,2048,2048,2056,2048,2049,2048,2048,2048,2048,2048,2048,2048,2048,2057,2057,2035,1975,2048,2048,2051,2033,1940,1936,1961,1997,1990,1899,1967,2012,2011,1984,2000,2006,2009,1990,1961,1953,1796,1930,2004,1973,1976,1981,1862,1901,1963,1967,1937,1931,2027,2002,1973,1926,1927,1882,1996,2057,2049,2031,2047,2056,2047,2048,2048,2052,2048,1936,2048,2056,2050,2048,2025,2055,1839,1843,1773,1798,2012,1947,1863,1976,1904,1645,1604,1914,2048,1807,1356,1797,1297,1243,1914,1833,743,666,564,767,683,781,675,687,599,592,633,662,842,782,724,853,533,370,360,471,451,456,340,328,374,334,434,463,513,495,419,486,480,492,493,509,496,514,469,500,430,506,333,455,444,561,440,492,462,409,428,509,486,515,445,377,292,472,483,534,452,510,503,461,456,461,446,484,433,423,376,480,481,525,388,421,512,476,416,416,441,375,443,479,482,479,349,464,425,464,427,361,443,445,440,401,428,425,426,506,480,440,411,433,462,419,458,460,405,469,464,415,430,475,446,436,434,830,417,307,406,363,371,315,369,396,461,311,414,367,315,267,263,550,573,356,247,303,244,227,244,453,486,603,422,247,392,644,473,617,426,409,411,451,299,758,637,569,453,670,585,821,542,710,656,565,761,1933,1675,134],"successes":[1,1,1,1,1,1,0,0,0,1,1,0,0,0,0,1,0,1,1,1,0,0,0,1,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,0,1,0,1,1,1,1,0,0,0,0,1,1,0,0,0,0,1,1,1,0,1,0,0,0,1,1,0,0,1,0,1,1,0,0,0,0,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,0,1,0,1,1,0,0,0,0,1,1,1,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,1,0,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,1,0,0,0,1,1,1,0,0,0,0,1,1,1,1,1,0,1,1,0,0,1,0,0,1,1,0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,1,1,0,0,0,0,1,1,1,1,1,0,1,1,0,0,0,0,1,1,1,0,0,1,1,1,1,1,0,0,0,1,1,1,0,0,0,0,1,1,0,0,0,0,1,1,1,0,1,0,1,1,1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
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
    loadPackage({"files": [{"filename": "/gfx/Cuteclysm/backdrop.png", "start": 0, "end": 27692}, {"filename": "/gfx/Cuteclysm/backdropoffset.png", "start": 27692, "end": 30345}, {"filename": "/gfx/Cuteclysm/creatures.png", "start": 30345, "end": 66086}, {"filename": "/gfx/Cuteclysm/expandedcreatures.png", "start": 66086, "end": 70296}, {"filename": "/gfx/Cuteclysm/fallback.png", "start": 70296, "end": 486266}, {"filename": "/gfx/Cuteclysm/fields.png", "start": 486266, "end": 488215}, {"filename": "/gfx/Cuteclysm/fillerItems.png", "start": 488215, "end": 556826}, {"filename": "/gfx/Cuteclysm/fillerVehicles.png", "start": 556826, "end": 626537}, {"filename": "/gfx/Cuteclysm/hugebackdrop.png", "start": 626537, "end": 637334}, {"filename": "/gfx/Cuteclysm/items.png", "start": 637334, "end": 650767}, {"filename": "/gfx/Cuteclysm/overlayoffset.png", "start": 650767, "end": 651012}, {"filename": "/gfx/Cuteclysm/overmap.png", "start": 651012, "end": 655799}, {"filename": "/gfx/Cuteclysm/tallbackdrop.png", "start": 655799, "end": 702521}, {"filename": "/gfx/Cuteclysm/tallexpandedcreatures.png", "start": 702521, "end": 703978}, {"filename": "/gfx/Cuteclysm/tile_config.json", "start": 703978, "end": 1046716}, {"filename": "/gfx/Cuteclysm/ui.png", "start": 1046716, "end": 1048471}, {"filename": "/gfx/Cuteclysm/ultratallbackdrop.png", "start": 1048471, "end": 1050774}], "remote_package_size": 780732});

  });
}
// END the loadDataFile function
