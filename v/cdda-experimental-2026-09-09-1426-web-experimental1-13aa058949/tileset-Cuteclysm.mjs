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
        var compressedData = {"data":null,"cachedOffset":808756,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,1080,1298,1765,3146,4393,5885,6955,8308,9510,10577,11768,12865,14918,16956,18921,20971,23016,25064,27112,29160,31208,33141,35198,37246,39294,41345,43238,44246,45547,47488,49536,51592,53514,55562,57616,59673,61721,63769,65817,67866,69914,71962,74010,76058,78106,80154,82202,84254,86295,88343,90391,92439,94487,96530,98582,100634,102682,104738,106769,108645,110693,112741,114794,116842,118887,120940,122983,125034,127082,129130,131178,133226,135157,137173,139221,141277,143325,145373,147424,149475,151524,153578,155633,157681,159730,161657,163713,165770,167818,169866,171921,173970,176014,178057,180105,182159,184216,186266,188178,190226,192283,194331,196379,198427,200459,202507,204564,206612,208662,210714,212686,214667,216723,218771,220819,222867,224919,226963,229008,231063,233116,235164,237212,239125,241181,243238,245286,247334,249391,251441,253485,255518,257566,259617,261674,263730,265666,267714,269762,271810,273858,275903,277953,280001,282049,284097,286145,288193,290134,292183,294238,296286,298334,300382,302436,304479,306524,308575,310630,312686,314741,316651,318699,320747,322795,324843,326891,328937,330961,333009,335057,337111,339164,341166,343145,345201,347249,349297,351345,353394,355439,357489,359543,361599,363647,365695,367642,369689,371744,373792,375840,377896,379949,381995,384033,386081,388134,390187,392232,394148,396196,398253,400301,402349,404397,406429,408472,410520,412568,414617,416672,418662,420660,422708,424756,426804,428852,430904,432949,434992,437047,439103,441151,443207,445162,447215,449263,451316,453364,455412,457462,459505,461545,463593,465645,467702,469755,471678,473735,475783,477831,479879,481927,483957,486005,488062,490110,492160,494215,496178,498198,500246,502281,503574,504924,506573,508348,510051,512108,514162,516219,518267,520303,522351,524370,526418,528466,530523,532571,534627,536675,538723,540771,542827,544880,546929,548977,551025,553073,555121,557177,559234,561282,563339,565387,567412,569426,571458,573506,575554,577573,579108,579961,581434,583357,585310,587275,589286,591264,593172,595169,597178,599164,601164,603172,605157,607166,609145,611116,613022,614848,616786,618782,620744,622710,624668,626493,628444,630398,632357,634277,636265,638269,640278,642213,644134,646030,647968,649991,652046,654089,656108,658162,660212,662257,664305,666353,668401,670449,672408,674456,676486,677721,679512,681238,683086,685135,687184,689225,691230,693055,695005,696585,698561,700614,702418,704357,706394,708197,709825,711677,713594,715642,716921,718615,720185,721361,723009,725051,726261,726948,727488,728177,728927,729793,730483,731185,731864,732373,733004,733600,734383,735178,735911,736619,737363,737744,738132,738532,738994,739452,739833,740167,740506,740856,741230,741684,742149,742653,743133,743583,744004,744520,745027,745543,746039,746527,747035,747483,747945,748416,748803,749221,749656,750139,750678,751151,751658,752102,752411,752941,753444,753906,754409,754855,755149,755504,756020,756500,757038,757487,757961,758465,758904,759340,759823,760288,760727,761212,761566,762000,762512,763031,763407,763791,764225,764772,765255,765716,766130,766580,767002,767435,767924,768393,768821,769252,769701,770157,770616,771039,771395,771859,772308,772719,773148,773591,774017,774475,774995,775482,775923,776330,776761,777210,777665,778135,778556,778997,779456,779872,780322,780780,781238,781661,782084,782603,783332,783647,784032,784476,784762,785132,785503,785839,786310,786641,787016,787422,787703,787987,788249,788556,789179,789738,789974,790253,790518,790765,791019,791351,791842,792454,792980,793214,793508,794018,794632,795212,795760,796164,796539,797003,797259,797702,798407,799000,799542,800091,800782,801587,802171,802852,803526,804078,804869,806597,808317],"sizes":[1080,218,467,1381,1247,1492,1070,1353,1202,1067,1191,1097,2053,2038,1965,2050,2045,2048,2048,2048,2048,1933,2057,2048,2048,2051,1893,1008,1301,1941,2048,2056,1922,2048,2054,2057,2048,2048,2048,2049,2048,2048,2048,2048,2048,2048,2048,2052,2041,2048,2048,2048,2048,2043,2052,2052,2048,2056,2031,1876,2048,2048,2053,2048,2045,2053,2043,2051,2048,2048,2048,2048,1931,2016,2048,2056,2048,2048,2051,2051,2049,2054,2055,2048,2049,1927,2056,2057,2048,2048,2055,2049,2044,2043,2048,2054,2057,2050,1912,2048,2057,2048,2048,2048,2032,2048,2057,2048,2050,2052,1972,1981,2056,2048,2048,2048,2052,2044,2045,2055,2053,2048,2048,1913,2056,2057,2048,2048,2057,2050,2044,2033,2048,2051,2057,2056,1936,2048,2048,2048,2048,2045,2050,2048,2048,2048,2048,2048,1941,2049,2055,2048,2048,2048,2054,2043,2045,2051,2055,2056,2055,1910,2048,2048,2048,2048,2048,2046,2024,2048,2048,2054,2053,2002,1979,2056,2048,2048,2048,2049,2045,2050,2054,2056,2048,2048,1947,2047,2055,2048,2048,2056,2053,2046,2038,2048,2053,2053,2045,1916,2048,2057,2048,2048,2048,2032,2043,2048,2048,2049,2055,1990,1998,2048,2048,2048,2048,2052,2045,2043,2055,2056,2048,2056,1955,2053,2048,2053,2048,2048,2050,2043,2040,2048,2052,2057,2053,1923,2057,2048,2048,2048,2048,2030,2048,2057,2048,2050,2055,1963,2020,2048,2035,1293,1350,1649,1775,1703,2057,2054,2057,2048,2036,2048,2019,2048,2048,2057,2048,2056,2048,2048,2048,2056,2053,2049,2048,2048,2048,2048,2056,2057,2048,2057,2048,2025,2014,2032,2048,2048,2019,1535,853,1473,1923,1953,1965,2011,1978,1908,1997,2009,1986,2000,2008,1985,2009,1979,1971,1906,1826,1938,1996,1962,1966,1958,1825,1951,1954,1959,1920,1988,2004,2009,1935,1921,1896,1938,2023,2055,2043,2019,2054,2050,2045,2048,2048,2048,2048,1959,2048,2030,1235,1791,1726,1848,2049,2049,2041,2005,1825,1950,1580,1976,2053,1804,1939,2037,1803,1628,1852,1917,2048,1279,1694,1570,1176,1648,2042,1210,687,540,689,750,866,690,702,679,509,631,596,783,795,733,708,744,381,388,400,462,458,381,334,339,350,374,454,465,504,480,450,421,516,507,516,496,488,508,448,462,471,387,418,435,483,539,473,507,444,309,530,503,462,503,446,294,355,516,480,538,449,474,504,439,436,483,465,439,485,354,434,512,519,376,384,434,547,483,461,414,450,422,433,489,469,428,431,449,456,459,423,356,464,449,411,429,443,426,458,520,487,441,407,431,449,455,470,421,441,459,416,450,458,458,423,423,519,729,315,385,444,286,370,371,336,471,331,375,406,281,284,262,307,623,559,236,279,265,247,254,332,491,612,526,234,294,510,614,580,548,404,375,464,256,443,705,593,542,549,691,805,584,681,674,552,791,1728,1720,439],"successes":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,0,0,1,1,1,1,1,0,1,1,0,1,1,0,0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,1,0,1,1,1,0,0,1,0,1,1,1,1,0,0,0,0,1,1,0,1,0,0,1,1,1,1,1,0,1,1,1,1,0,0,1,1,1,1,0,1,1,1,1,0,1,0,0,0,1,1,1,0,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,1,1,1,0,0,1,1,1,1,0,1,1,1,1,0,0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,1,1,1,0,0,1,1,1,1,0,1,1,1,1,0,1,0,0,0,1,1,0,0,1,1,1,1,0,0,0,0,1,1,1,1,1,0,1,1,1,0,1,0,0,1,1,1,0,1,1,1,1,1,0,0,0,0,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,0,1,0,1,0,0,0,1,1,1,0,0,0,0,1,1,0,1,0,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
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
    loadPackage({"files": [{"filename": "/gfx/Cuteclysm/backdrop.png", "start": 0, "end": 52050}, {"filename": "/gfx/Cuteclysm/backdropoffset.png", "start": 52050, "end": 54703}, {"filename": "/gfx/Cuteclysm/creatures.png", "start": 54703, "end": 95884}, {"filename": "/gfx/Cuteclysm/expandedcreatures.png", "start": 95884, "end": 100131}, {"filename": "/gfx/Cuteclysm/fallback.png", "start": 100131, "end": 516101}, {"filename": "/gfx/Cuteclysm/fields.png", "start": 516101, "end": 518089}, {"filename": "/gfx/Cuteclysm/fillerItems.png", "start": 518089, "end": 596242}, {"filename": "/gfx/Cuteclysm/fillerVehicles.png", "start": 596242, "end": 670677}, {"filename": "/gfx/Cuteclysm/hugebackdrop.png", "start": 670677, "end": 681511}, {"filename": "/gfx/Cuteclysm/items.png", "start": 681511, "end": 694981}, {"filename": "/gfx/Cuteclysm/overlayoffset.png", "start": 694981, "end": 695226}, {"filename": "/gfx/Cuteclysm/overmap.png", "start": 695226, "end": 700168}, {"filename": "/gfx/Cuteclysm/tallbackdrop.png", "start": 700168, "end": 754701}, {"filename": "/gfx/Cuteclysm/tallexpandedcreatures.png", "start": 754701, "end": 756158}, {"filename": "/gfx/Cuteclysm/tile_config.json", "start": 756158, "end": 1098245}, {"filename": "/gfx/Cuteclysm/ui.png", "start": 1098245, "end": 1100000}, {"filename": "/gfx/Cuteclysm/ultratallbackdrop.png", "start": 1100000, "end": 1102303}], "remote_package_size": 812852});

  });
}
// END the loadDataFile function
