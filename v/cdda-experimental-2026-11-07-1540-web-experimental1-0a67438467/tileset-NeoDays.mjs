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
        var compressedData = {"data":null,"cachedOffset":403594,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,2048,4096,6144,8192,10240,12288,14336,16384,18432,20480,22528,24576,26624,28672,30720,32768,34816,36864,38912,40960,43008,45056,47104,49153,51201,53255,55303,57351,59265,61239,63268,65316,67198,69153,71193,73205,75177,77159,78282,79068,79663,80120,80580,81060,81578,82058,82566,83048,83544,84079,84621,85096,85618,86175,86723,87208,87741,88212,88741,89294,89806,90318,90952,91565,92116,92635,93190,93856,94362,95008,95695,96525,97310,98200,99094,99928,100780,101551,102368,103247,104142,105021,105798,106604,107404,108287,109214,110008,110928,111810,112673,113510,114206,114897,115709,116504,117458,118232,118916,119777,120388,121040,121666,122306,122981,123730,124675,125653,126574,127516,128173,128936,129742,130614,131514,132422,133251,134101,134864,135684,136513,137304,138171,138998,139909,140729,141684,142658,143416,144152,145049,145916,146778,147653,148392,149299,150072,150931,151678,152389,153092,153795,154357,155065,155757,156354,157042,157886,158707,159452,160241,161112,162011,162713,163424,164162,164950,165752,166435,167056,167728,168335,168886,169586,170322,170865,171357,171814,172389,172959,173508,174174,174846,175597,176091,176511,177100,177547,178002,178566,179102,179539,180046,180479,181033,181515,181908,182377,182903,183389,183799,184167,184622,185163,185624,186004,186553,186994,187334,187803,188199,188573,188946,189325,190210,191084,191726,192652,193422,194353,195252,196186,197025,197857,198369,198795,199221,199648,200074,200507,201080,201683,202327,203098,203836,204546,205294,206063,206765,207555,208366,209141,209918,210673,211314,211804,212304,212815,213313,213828,214386,215114,215889,216577,217299,218000,218725,219470,220206,220922,221750,222520,223302,223979,224668,225385,226056,226675,227305,228037,228715,229405,230021,230587,231174,231860,232590,233307,233984,234664,235360,236099,236830,237615,238421,239363,239795,240239,240803,241300,241837,242446,243008,243621,244208,244818,245367,245949,246522,247087,247620,248177,248721,249346,249980,250591,251178,251741,252336,252904,253449,253898,254284,254778,255251,255711,256112,256619,257132,257922,258637,259104,259578,260045,260520,260996,261469,261937,262406,262880,263452,264024,264562,265080,266030,268078,270097,272082,274105,276113,278170,280225,282260,284308,286356,288404,290452,292500,294548,296596,298644,300692,302740,304788,306836,308884,310932,312980,315028,317084,319138,321182,323230,325278,327326,329375,331389,333437,335485,337533,339581,341629,343677,345725,347773,349821,351878,353926,355974,358022,360076,362124,364172,366220,368268,370316,372364,374412,376460,378508,380556,382604,384658,386709,388757,390805,392853,394907,396955,399003,401051,403099],"sizes":[2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2049,2048,2054,2048,2048,1914,1974,2029,2048,1882,1955,2040,2012,1972,1982,1123,786,595,457,460,480,518,480,508,482,496,535,542,475,522,557,548,485,533,471,529,553,512,512,634,613,551,519,555,666,506,646,687,830,785,890,894,834,852,771,817,879,895,879,777,806,800,883,927,794,920,882,863,837,696,691,812,795,954,774,684,861,611,652,626,640,675,749,945,978,921,942,657,763,806,872,900,908,829,850,763,820,829,791,867,827,911,820,955,974,758,736,897,867,862,875,739,907,773,859,747,711,703,703,562,708,692,597,688,844,821,745,789,871,899,702,711,738,788,802,683,621,672,607,551,700,736,543,492,457,575,570,549,666,672,751,494,420,589,447,455,564,536,437,507,433,554,482,393,469,526,486,410,368,455,541,461,380,549,441,340,469,396,374,373,379,885,874,642,926,770,931,899,934,839,832,512,426,426,427,426,433,573,603,644,771,738,710,748,769,702,790,811,775,777,755,641,490,500,511,498,515,558,728,775,688,722,701,725,745,736,716,828,770,782,677,689,717,671,619,630,732,678,690,616,566,587,686,730,717,677,680,696,739,731,785,806,942,432,444,564,497,537,609,562,613,587,610,549,582,573,565,533,557,544,625,634,611,587,563,595,568,545,449,386,494,473,460,401,507,513,790,715,467,474,467,475,476,473,468,469,474,572,572,538,518,950,2048,2019,1985,2023,2008,2057,2055,2035,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2056,2054,2044,2048,2048,2048,2049,2014,2048,2048,2048,2048,2048,2048,2048,2048,2048,2057,2048,2048,2048,2054,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2048,2054,2051,2048,2048,2048,2054,2048,2048,2048,2048,495],"successes":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,0,0,0,0,0]}
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
    loadPackage({"files": [{"filename": "/gfx/NeoDays/fallback.png", "start": 0, "end": 47126}, {"filename": "/gfx/NeoDays/large.png", "start": 47126, "end": 78663}, {"filename": "/gfx/NeoDays/layering.json", "start": 78663, "end": 80208}, {"filename": "/gfx/NeoDays/tile_config.json", "start": 80208, "end": 665186}, {"filename": "/gfx/NeoDays/tiles.png", "start": 665186, "end": 803311}], "remote_package_size": 407690});

  });
}
// END the loadDataFile function
