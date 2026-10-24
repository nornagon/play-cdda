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
        var compressedData = {"data":null,"cachedOffset":404810,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2048,4096,6144,8192,10240,12288,14336,16384,18432,20480,22528,24576,26624,28672,30720,32768,34816,36864,38912,40960,43008,45056,47104,49152,51200,53248,55296,57299,59253,61229,63285,65277,67186,69164,71181,73172,75135,77139,77707,78340,78799,79245,79708,80250,80798,81245,81772,82213,82731,83252,83770,84282,84790,85331,85826,86336,86829,87351,87891,88442,88937,89450,90145,90654,91192,91713,92220,92861,93402,94109,94779,95581,96477,97346,98172,99086,99886,100754,101548,102448,103354,104206,105001,105801,106656,107586,108455,109279,110191,111034,111958,112718,113506,114209,114949,115873,116763,117440,118277,118986,119574,120276,120851,121524,122290,122996,124035,124963,125846,126759,127406,128285,129149,129984,130949,131851,132666,133453,134223,135084,135913,136744,137609,138454,139300,140179,141156,141929,142736,143471,144414,145270,146113,146934,147796,148639,149431,150205,150974,151676,152409,152990,153703,154378,154978,155635,156363,157257,157987,158709,159559,160379,161098,161738,162351,163165,163851,164613,165341,166047,166655,167256,167832,168584,169265,169820,170294,170799,171362,171814,172488,173206,173983,174480,174924,175433,175968,176431,176854,177489,177979,178438,178872,179389,179928,180325,180784,181224,181799,182214,182604,183121,183536,184010,184445,184924,185394,185814,186274,186603,187010,187436,187782,188396,189314,190081,190974,191794,192557,193513,194453,195339,196168,196837,197347,197777,198203,198635,199067,199610,200199,200821,201572,202308,203052,203741,204528,205211,206000,206780,207552,208335,209086,209852,210345,210837,211330,211841,212368,212877,213514,214279,214977,215700,216427,217187,217929,218713,219401,220220,221019,221830,222496,223257,223962,224641,225254,225903,226573,227316,227992,228616,229174,229767,230435,231079,231807,232471,233199,233831,234551,235291,236048,236804,237838,238381,238816,239332,239859,240360,241021,241554,242131,242726,243341,243889,244476,245020,245604,246155,246699,247297,247921,248540,249146,249704,250297,250857,251431,251995,252463,252880,253350,253873,254344,254779,255250,255814,256577,257299,257782,258260,258746,259216,259686,260154,260632,261106,261582,262141,262713,263248,263773,264543,265700,266770,268213,270254,272268,274261,276293,278340,280396,282444,284492,286540,288588,290636,292684,294732,296780,298828,300876,302924,304972,307020,309068,311116,313164,315212,317260,319308,321363,323407,325455,327503,329551,331599,333655,335703,337751,339799,341847,343895,345943,347991,350039,352087,354135,356183,358231,360287,362335,364383,366431,368479,370527,372575,374623,376671,378719,380767,382824,384872,386920,388968,391016,393073,395121,397169,399217,401265,403313],"sizes":[2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2003,1954,1976,2056,1992,1909,1978,2017,1991,1963,2004,568,633,459,446,463,542,548,447,527,441,518,521,518,512,508,541,495,510,493,522,540,551,495,513,695,509,538,521,507,641,541,707,670,802,896,869,826,914,800,868,794,900,906,852,795,800,855,930,869,824,912,843,924,760,788,703,740,924,890,677,837,709,588,702,575,673,766,706,1039,928,883,913,647,879,864,835,965,902,815,787,770,861,829,831,865,845,846,879,977,773,807,735,943,856,843,821,862,843,792,774,769,702,733,581,713,675,600,657,728,894,730,722,850,820,719,640,613,814,686,762,728,706,608,601,576,752,681,555,474,505,563,452,674,718,777,497,444,509,535,463,423,635,490,459,434,517,539,397,459,440,575,415,390,517,415,474,435,479,470,420,460,329,407,426,346,614,918,767,893,820,763,956,940,886,829,669,510,430,426,432,432,543,589,622,751,736,744,689,787,683,789,780,772,783,751,766,493,492,493,511,527,509,637,765,698,723,727,760,742,784,688,819,799,811,666,761,705,679,613,649,670,743,676,624,558,593,668,644,728,664,728,632,720,740,757,756,1034,543,435,516,527,501,661,533,577,595,615,548,587,544,584,551,544,598,624,619,606,558,593,560,574,564,468,417,470,523,471,435,471,564,763,722,483,478,486,470,470,468,478,474,476,559,572,535,525,770,1157,1070,1443,2041,2014,1993,2032,2047,2056,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2055,2044,2048,2048,2048,2048,2056,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2056,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2048,2057,2048,2048,2048,2048,2048,1497],"successes":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0]}
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
    loadPackage({"files": [{"filename": "/gfx/NeoDays/fallback.png", "start": 0, "end": 47126}, {"filename": "/gfx/NeoDays/large.png", "start": 47126, "end": 77848}, {"filename": "/gfx/NeoDays/layering.json", "start": 77848, "end": 79393}, {"filename": "/gfx/NeoDays/tile_config.json", "start": 79393, "end": 663282}, {"filename": "/gfx/NeoDays/tiles.png", "start": 663282, "end": 806361}], "remote_package_size": 408906});

  });
}
// END the loadDataFile function
