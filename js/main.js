
        // --- 1. Internationalization System (I18n) ---
        const TRANSLATIONS = {
            zh: {
                title: "土地价格率曲线生成器",
                deployButton: "一键部署",
                step1: "1. 土地数据上传",
                uploadHint: "点击或拖拽上传",
                formatHint: "支持 CSV, XLSX",
                manualInput: "或手动输入 (每行/逗号分隔)",
                manualPlaceholder: "100, 200, 350...",
                confirmInput: "确认输入",
                count: "总数",
                step2: "2. 锚定点输入",
                add: "添加",
                landSize: "土地面积",
                priceRate: "单位价格",
                generateBtn: "生成 PCHIP 插值曲线",
                visualAnalysis: "可视化分析",
                legendCurve: "曲线",
                legendAnchor: "锚定点",
                emptyState: "准备就绪，请上传数据并生成图表",
                avgRate: "平均 Price Rate",
                dataPoints: "数据点",
                anchorPoints: "锚定点",
                dlResults: "下载结果 (CSV)",
                dlLookup: "下载逐点表 (CSV)",
                chartTitle: "土地价格率曲线 (PCHIP)",
                xAxis: "土地面积",
                yAxis: "单位价格",
                avgLine: "平均值",
                curveName: "PCHIP 曲线",
                anchorName: "锚定点",
                errorNoData: "请先上传数据",
                errorAnchors: "至少需要2个有效锚定点",
                invalidData: "无效数据",
                toggleLabel: "English", // Button shows target language
                filenameResults: "土地价格率_结果.csv",
                filenameLookup: "土地价格率_逐点表_300-800.csv"
            },
            en: {
                title: "Land Price Rate Generator",
                deployButton: "Deploy App",
                step1: "1. Upload Land Data",
                uploadHint: "Click or Drag to Upload",
                formatHint: "Supports CSV, XLSX",
                manualInput: "Or Manual Input (Comma/Line)",
                manualPlaceholder: "100, 200, 350...",
                confirmInput: "Confirm Input",
                count: "Total",
                step2: "2. Input Anchors",
                add: "Add",
                landSize: "Land Size",
                priceRate: "Price Rate",
                generateBtn: "Generate PCHIP Curve",
                visualAnalysis: "Visual Analysis",
                legendCurve: "Curve",
                legendAnchor: "Anchors",
                emptyState: "Ready. Upload data to generate chart.",
                avgRate: "Avg Price Rate",
                dataPoints: "Data Points",
                anchorPoints: "Anchors",
                dlResults: "Download Results (CSV)",
                dlLookup: "Download Lookup Table (CSV)",
                chartTitle: "Land Price Rate Curve (PCHIP)",
                xAxis: "Land Size",
                yAxis: "Price Rate",
                avgLine: "Average",
                curveName: "PCHIP Curve",
                anchorName: "Anchors",
                errorNoData: "Please upload data first",
                errorAnchors: "At least 2 valid anchor points required",
                invalidData: "Invalid Data",
                toggleLabel: "中文", // Button shows target language
                filenameResults: "LandPriceRate_Results.csv",
                filenameLookup: "LandPriceRate_LookupTable_300-800.csv"
            }
        };

        const LangManager = {
            current: 'zh',
            init() {
                const browserLang = navigator.language || navigator.userLanguage;
                this.current = browserLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
                this.apply();
            },
            toggle() {
                this.current = this.current === 'zh' ? 'en' : 'zh';
                this.apply();
            },
            t(key) {
                return TRANSLATIONS[this.current][key] || key;
            },
            apply() {
                // Update Text Content
                document.querySelectorAll('[data-i18n]').forEach(el => {
                    const key = el.getAttribute('data-i18n');
                    el.textContent = this.t(key);
                });
                // Update Placeholders
                document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                    const key = el.getAttribute('data-i18n-placeholder');
                    el.placeholder = this.t(key);
                });
                // Update Language Button Label
                document.getElementById('currentLangLabel').textContent = this.t('toggleLabel');
                
                // Update Chart if exists
                if (window.updateChartLang) window.updateChartLang();
            }
        };

        // --- PCHIP Algorithm ---
        const PCHIP = {
            setup: function(x, y) {
                const n = x.length;
                const h = [], d = [];
                for (let i = 0; i < n - 1; i++) {
                    h[i] = x[i + 1] - x[i];
                    d[i] = (y[i + 1] - y[i]) / h[i];
                }
                const m = new Array(n).fill(0);
                if (n === 2) {
                    m[0] = d[0]; m[1] = d[0];
                } else {
                    for (let i = 1; i < n - 1; i++) {
                        if (d[i-1] * d[i] <= 0) m[i] = 0;
                        else {
                            const w1 = 2 * h[i] + h[i - 1];
                            const w2 = h[i] + 2 * h[i - 1];
                            m[i] = (w1 + w2) / (w1 / d[i-1] + w2 / d[i]);
                        }
                    }
                    m[0] = ((2 * h[0] + h[1]) * d[0] - h[0] * d[1]) / (h[0] + h[1]);
                    if (Math.sign(m[0]) !== Math.sign(d[0])) m[0] = 0;
                    else if (Math.sign(d[0]) !== Math.sign(d[1]) && Math.abs(m[0]) > Math.abs(3 * d[0])) m[0] = 3 * d[0];

                    m[n - 1] = ((2 * h[n-2] + h[n-3]) * d[n-2] - h[n-2] * d[n-3]) / (h[n-2] + h[n-3]);
                    if (Math.sign(m[n - 1]) !== Math.sign(d[n - 2])) m[n - 1] = 0;
                    else if (Math.sign(d[n - 2]) !== Math.sign(d[n - 3]) && Math.abs(m[n - 1]) > Math.abs(3 * d[n - 2])) m[n - 1] = 3 * d[n - 2];
                }
                return { x, y, m, h };
            },
            evaluate: function(params, queryPoints) {
                const { x, y, m, h } = params;
                const n = x.length;
                return queryPoints.map(xq => {
                    let k = 0;
                    if (xq <= x[0]) return y[0] + m[0] * (xq - x[0]);
                    else if (xq >= x[n-1]) return y[n-1] + m[n-1] * (xq - x[n-1]);
                    else {
                        for (let i = 0; i < n - 1; i++) {
                            if (xq >= x[i] && xq < x[i + 1]) { k = i; break; }
                        }
                    }
                    const dx = xq - x[k];
                    const t = dx / h[k];
                    const t2 = t * t;
                    const h00 = 2 * t2*t - 3 * t2 + 1;
                    const h10 = t2*t - 2 * t2 + t;
                    const h01 = -2 * t2*t + 3 * t2;
                    const h11 = t2*t - t2;
                    return h00 * y[k] + h10 * h[k] * m[k] + h01 * y[k + 1] + h11 * h[k] * m[k + 1];
                });
            }
        };

        // --- App State & UI ---
        const State = {
            uploadedData: [],
            anchors: [
                { size: 100, rate: 1000 },
                { size: 1000, rate: 500 }
            ],
            lastPchipParams: null,
            results: []
        };

        const els = {
            fileInput: document.getElementById('fileInput'),
            toggleManual: document.getElementById('toggleManualInput'),
            manualContainer: document.getElementById('manualInputContainer'),
            manualIcon: document.getElementById('manualIcon'),
            manualInput: document.getElementById('manualDataInput'),
            processManualBtn: document.getElementById('processManualData'),
            dataStatus: document.getElementById('dataStatus'),
            statCount: document.getElementById('statCount'),
            statMin: document.getElementById('statMin'),
            statMax: document.getElementById('statMax'),
            previewData: document.getElementById('previewData'),
            anchorsContainer: document.getElementById('anchorsContainer'),
            addAnchorBtn: document.getElementById('addAnchorBtn'),
            generateBtn: document.getElementById('generateBtn'),
            chartDiv: document.getElementById('chartDiv'),
            emptyState: document.getElementById('emptyState'),
            resultsPanel: document.getElementById('resultsPanel'),
            resAvgRate: document.getElementById('resAvgRate'),
            resDataCount: document.getElementById('resDataCount'),
            resAnchorCount: document.getElementById('resAnchorCount'),
            downloadResultsBtn: document.getElementById('downloadResultsBtn'),
            downloadLookupBtn: document.getElementById('downloadLookupBtn'),
            deployBtn: document.getElementById('deployFloatBtn'),
            langToggleBtn: document.getElementById('langToggleBtn')
        };

        // UI Helpers
        function renderAnchors() {
            els.anchorsContainer.innerHTML = '';
            State.anchors.forEach((a, idx) => {
                const row = document.createElement('div');
                row.className = 'grid grid-cols-[1fr_1fr_40px] px-3 py-1.5 border-b border-slate-50 items-center gap-2 hover:bg-slate-50 transition-colors';
                row.innerHTML = `
                    <input type="number" step="any" value="${a.size}" onchange="updateAnchor(${idx}, 'size', this.value)" 
                        class="w-full text-xs p-1.5 border border-slate-100 rounded focus:border-blue-400 outline-none">
                    <input type="number" step="any" value="${a.rate}" onchange="updateAnchor(${idx}, 'rate', this.value)" 
                        class="w-full text-xs p-1.5 border border-slate-100 rounded focus:border-blue-400 outline-none">
                    <button onclick="removeAnchor(${idx})" class="text-slate-300 hover:text-red-500 transition-colors flex justify-center" ${State.anchors.length <= 2 ? 'disabled' : ''}>
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                `;
                els.anchorsContainer.appendChild(row);
            });
        }
        window.updateAnchor = (idx, f, v) => State.anchors[idx][f] = parseFloat(v);
        window.removeAnchor = (idx) => { State.anchors.splice(idx, 1); renderAnchors(); };
        els.addAnchorBtn.onclick = () => { 
            const last = State.anchors[State.anchors.length - 1];
            State.anchors.push({ size: (last ? last.size + 100 : 100), rate: (last ? last.rate : 1000) });
            renderAnchors(); 
        };

        function processData(arr) {
            const clean = arr.filter(n => !isNaN(n) && n > 0).sort((a,b) => a-b);
            if (clean.length === 0) return alert(LangManager.t('invalidData'));
            State.uploadedData = clean;
            els.dataStatus.classList.remove('hidden');
            els.statCount.textContent = clean.length;
            els.statMin.textContent = Math.min(...clean).toLocaleString();
            els.statMax.textContent = Math.max(...clean).toLocaleString();
            els.previewData.innerHTML = clean.slice(0, 50).map(v => `<span class="inline-block bg-slate-100 px-1 rounded mr-1 mb-1">${v}</span>`).join('');
        }

        // Event Listeners
        els.fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.name.endsWith('.csv')) Papa.parse(file, { complete: (res) => processData(res.data.map(r => parseFloat(r[0]))) });
            else {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
                    const sheet = wb.Sheets[wb.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    processData(json.map(r => parseFloat(r[0])));
                };
                reader.readAsArrayBuffer(file);
            }
        };

        els.toggleManual.onclick = () => {
            els.manualContainer.classList.toggle('hidden');
            els.manualIcon.style.transform = els.manualContainer.classList.contains('hidden') ? '' : 'rotate(180deg)';
        };
        els.processManualBtn.onclick = () => {
            processData(els.manualInput.value.split(/[\n,]+/).map(s => parseFloat(s.trim())));
            els.manualContainer.classList.add('hidden');
        };
        els.langToggleBtn.onclick = () => LangManager.toggle();

        // Generation
        els.generateBtn.onclick = () => {
            if (State.uploadedData.length === 0) return alert(LangManager.t('errorNoData'));
            const validAnchors = State.anchors.filter(a => !isNaN(a.size) && !isNaN(a.rate)).sort((a,b) => a.size - b.size);
            if (validAnchors.length < 2) return alert(LangManager.t('errorAnchors'));

            const xNodes = validAnchors.map(a => a.size);
            const yNodes = validAnchors.map(a => a.rate);
            const params = PCHIP.setup(xNodes, yNodes);
            State.lastPchipParams = params;
            State.lastAnchors = {x: xNodes, y: yNodes}; // Store for redraw

            const minX = Math.min(...State.uploadedData, xNodes[0]);
            const maxX = Math.max(...State.uploadedData, xNodes[xNodes.length - 1]);
            const plotX = Array.from({length: 200}, (_, i) => minX + (maxX-minX)*(i/199));
            const plotY = PCHIP.evaluate(params, plotX);
            const dataY = PCHIP.evaluate(params, State.uploadedData);
            
            State.results = State.uploadedData.map((x, i) => ({ x, y: dataY[i] }));
            State.avgRate = dataY.reduce((a, b) => a + b, 0) / dataY.length;
            State.plotData = { plotX, plotY, minX, maxX }; // Store for redraw

            drawChart();
            els.resAvgRate.textContent = State.avgRate.toLocaleString(undefined, { maximumFractionDigits: 2 });
            els.resDataCount.textContent = State.uploadedData.length;
            els.resAnchorCount.textContent = validAnchors.length;
            els.emptyState.classList.add('hidden');
            els.resultsPanel.classList.remove('invisible', 'opacity-0', 'translate-y-4');
        };

        function drawChart() {
            if (!State.plotData) return;
            const { plotX, plotY, minX, maxX } = State.plotData;
            const { x: ax, y: ay } = State.lastAnchors;
            const t = key => LangManager.t(key);

            const curve = { x: plotX, y: plotY, mode: 'lines', name: t('curveName'), line: { color: '#2563eb', width: 3 } };
            const anchors = { x: ax, y: ay, mode: 'markers', name: t('anchorName'), marker: { color: '#ef4444', size: 10, line: { color: 'white', width: 2 } } };
            const average = { x: [minX, maxX], y: [State.avgRate, State.avgRate], mode: 'lines', name: t('avgLine'), line: { color: '#10b981', width: 2, dash: 'dash' } };

            const layout = {
                title: t('chartTitle'),
                margin: { t: 40, r: 40, l: 60, b: 60 },
                xaxis: { title: t('xAxis'), gridcolor: '#f1f5f9' },
                yaxis: { title: t('yAxis'), gridcolor: '#f1f5f9' },
                hovermode: 'closest',
                showlegend: true,
                legend: { x: 1, xanchor: 'right', y: 1 }
            };
            Plotly.newPlot(els.chartDiv, [curve, anchors, average], layout, { responsive: true, displayModeBar: false });
        }
        window.updateChartLang = drawChart;

        // Downloads
        els.downloadResultsBtn.onclick = () => {
            const csv = Papa.unparse(State.results.map(r => ({ [LangManager.t('landSize')]: r.x, [LangManager.t('priceRate')]: r.y })));
            saveAs(new Blob([csv], { type: 'text/csv' }), LangManager.t('filenameResults'));
        };

        els.downloadLookupBtn.onclick = () => {
            if (!State.lastPchipParams) return;
            const lookups = [];
            for(let x=300; x<=800; x++) {
                lookups.push({ [LangManager.t('landSize')]: x, [LangManager.t('priceRate')]: PCHIP.evaluate(State.lastPchipParams, [x])[0] });
            }
            saveAs(new Blob([Papa.unparse(lookups)], { type: 'text/csv' }), LangManager.t('filenameLookup'));
        };

        // Deployment Package
        els.deployBtn.onclick = async () => {
            const btn = els.deployBtn;
            const origHtml = btn.innerHTML;
            btn.innerHTML = `<span class="loader"></span>`;
            btn.disabled = true;

            try {
                const zip = new JSZip();
                
                // Get Script and CSS
                // We assume main script is the last one in body
                const scripts = document.querySelectorAll('script');
                const mainScript = scripts[scripts.length - 1].innerHTML;
                const styleContent = document.querySelector('style').innerHTML;

                // Create HTML for deployment
                // We construct it carefully to avoid parser issues
                const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Land Price Rate Generator</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"><\/script>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
    <link href="css/style.css" rel="stylesheet"/>
</head>
<body class="bg-slate-50 text-slate-800 h-screen flex flex-col overflow-hidden">
    ${document.body.innerHTML
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '') // Remove existing scripts
        .replace(/id="deployFloatBtn"[\s\S]*?<\/button>/, '') // Remove deploy button
    }
    <script src="js/main.js"><\/script>
</body>
</html>`;

                zip.file("index.html", indexHtml);
                
                const cssFolder = zip.folder("css");
                cssFolder.file("style.css", styleContent);
                
                const jsFolder = zip.folder("js");
                jsFolder.file("main.js", mainScript);

                zip.file("README.md", "# Land Price Rate Generator\n\nReady for GitHub Pages deployment.");
                zip.file(".nojekyll", "");

                const content = await zip.generateAsync({type:"blob"});
                saveAs(content, "LandPriceRate_App_Deploy.zip");
            } catch (e) {
                alert("Error creating zip: " + e.message);
                console.error(e);
            } finally {
                btn.innerHTML = origHtml;
                btn.disabled = false;
            }
        };

        // Init
        LangManager.init();
        renderAnchors();
    