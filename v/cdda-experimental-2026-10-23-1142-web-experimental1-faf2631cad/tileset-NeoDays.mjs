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
      var PACKAGE_NAME = 'build/tileset-NeoDays.data';
      var REMOTE_PACKAGE_BASE = 'tileset-NeoDays.data';
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
Module['FS_createPath']("/gfx", "NeoDays", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        var compressedData = {"data":null,"cachedOffset":401845,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2048,4096,6144,8192,10240,12288,14336,16384,18432,20480,22528,24576,26624,28672,30720,32768,34816,36864,38912,40960,43008,45056,47104,49152,51200,53248,55296,57300,59255,61214,63271,65263,67146,69153,71170,73159,75123,77128,77678,78314,78774,79226,79692,80226,80788,81248,81776,82225,82744,83278,83785,84300,84812,85349,85847,86369,86862,87383,87935,88478,88973,89490,90196,90719,91248,91750,92261,92903,93439,94174,94830,95633,96502,97376,98186,99100,99904,100774,101577,102479,103393,104231,105021,105850,106714,107624,108478,109302,110195,111048,111953,112703,113495,114188,114942,115866,116761,117430,118272,118976,119556,120263,120832,121514,122278,122999,124042,124979,125860,126754,127411,128325,129196,130025,130983,131878,132692,133487,134250,135097,135910,136746,137605,138458,139300,140163,141143,141898,142717,143456,144400,145268,146118,146924,147793,148639,149434,150196,150974,151685,152416,152992,153710,154386,154986,155653,156375,157262,157991,158723,159570,160394,161125,161767,162370,163194,163877,164650,165371,166079,166674,167282,167861,168615,169285,169833,170308,170817,171380,171845,172500,173224,174008,174517,174961,175486,176002,176467,176913,177543,178028,178489,178919,179436,179967,180361,180831,181278,181846,182262,182658,183181,183605,184079,184515,184991,185468,185891,186371,186704,187100,187519,187868,188503,189433,190191,191094,191914,192672,193619,194565,195455,196250,196909,197417,197845,198268,198695,199122,199673,200259,200885,201649,202399,203139,203845,204638,205320,206112,206898,207669,208454,209202,209963,210452,210944,211429,211938,212460,212974,213612,214387,215078,215804,216535,217302,218029,218797,219492,220312,221114,221921,222573,223335,224053,224731,225344,225995,226659,227406,228077,228712,229272,229869,230548,231196,231936,232599,233330,233961,234674,235415,236166,236913,237934,238448,238884,239410,239933,240436,241086,241615,242205,242784,243391,243934,244520,245072,245646,246193,246736,247322,247956,248579,249189,249752,250342,250902,251483,252041,252499,252917,253387,253910,254379,254799,255271,255834,256605,257327,257808,258283,258759,259226,259693,260160,260643,261109,261578,262137,262713,263239,263773,264641,266664,268668,270658,272701,274717,276764,278811,280841,282889,284937,286985,289033,291081,293129,295177,297225,299280,301328,303376,305424,307472,309520,311568,313616,315664,317704,319761,321809,323857,325905,327953,329962,332015,334063,336111,338159,340207,342255,344303,346351,348399,350447,352495,354543,356591,358639,360687,362735,364783,366831,368879,370927,372975,375023,377071,379119,381172,383227,385275,387323,389371,391419,393474,395522,397570,399618,401666],"sizes":[2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2004,1955,1959,2057,1992,1883,2007,2017,1989,1964,2005,550,636,460,452,466,534,562,460,528,449,519,534,507,515,512,537,498,522,493,521,552,543,495,517,706,523,529,502,511,642,536,735,656,803,869,874,810,914,804,870,803,902,914,838,790,829,864,910,854,824,893,853,905,750,792,693,754,924,895,669,842,704,580,707,569,682,764,721,1043,937,881,894,657,914,871,829,958,895,814,795,763,847,813,836,859,853,842,863,980,755,819,739,944,868,850,806,869,846,795,762,778,711,731,576,718,676,600,667,722,887,729,732,847,824,731,642,603,824,683,773,721,708,595,608,579,754,670,548,475,509,563,465,655,724,784,509,444,525,516,465,446,630,485,461,430,517,531,394,470,447,568,416,396,523,424,474,436,476,477,423,480,333,396,419,349,635,930,758,903,820,758,947,946,890,795,659,508,428,423,427,427,551,586,626,764,750,740,706,793,682,792,786,771,785,748,761,489,492,485,509,522,514,638,775,691,726,731,767,727,768,695,820,802,807,652,762,718,678,613,651,664,747,671,635,560,597,679,648,740,663,731,631,713,741,751,747,1021,514,436,526,523,503,650,529,590,579,607,543,586,552,574,547,543,586,634,623,610,563,590,560,581,558,458,418,470,523,469,420,472,563,771,722,481,475,476,467,467,467,483,466,469,559,576,526,534,868,2023,2004,1990,2043,2016,2047,2047,2030,2048,2048,2048,2048,2048,2048,2048,2048,2055,2048,2048,2048,2048,2048,2048,2048,2048,2040,2057,2048,2048,2048,2048,2009,2053,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2053,2055,2048,2048,2048,2048,2055,2048,2048,2048,2048,179],"successes":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,0,0,0]}
;
            compressedData['data'] = byteArray;
            assert(typeof Module['LZ4'] === 'object', 'LZ4 not present - was your app build with -sLZ4?');
            await Module['LZ4'].loadPackage({ 'metadata': metadata, 'compressedData': compressedData }, false);
            Module['removeRunDependency']('datafile_build/tileset-NeoDays.data');
loadDataResolve();
      }
      Module['addRunDependency']('datafile_build/tileset-NeoDays.data');

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
    loadPackage({"files": [{"filename": "/gfx/NeoDays/fallback.png", "start": 0, "end": 47126}, {"filename": "/gfx/NeoDays/large.png", "start": 47126, "end": 77811}, {"filename": "/gfx/NeoDays/layering.json", "start": 77811, "end": 79356}, {"filename": "/gfx/NeoDays/tile_config.json", "start": 79356, "end": 663245}, {"filename": "/gfx/NeoDays/tiles.png", "start": 663245, "end": 800947}], "remote_package_size": 405941});

  });
}
// END the loadDataFile function
