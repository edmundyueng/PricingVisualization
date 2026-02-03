
        // --- Translations ---
        const TRANSLATIONS = {
            zh: {
                title: "土地价格率曲线生成器",
                subtitle: "Land Price Rate PCHIP Generator",
                headerInfo: "PCHIP 单调插值 | 步长 1 逐点表 (300-800)",
                deployButton: "一键部署",
                deployTooltip: "下载完整项目，部署到 GitHub Pages",
                langToggle: "English",
                step1: "1. 上传土地面积数据",
                uploadText: "点击或拖拽上传文件",
                uploadHint: "支持 CSV 或 Excel (第一列为 Land Size)",
                manualInput: "或手动输入数据 (每行一个)",
                manualInputPlaceholder: "100\n200\n350",
                confirmInput: "确认手动数据",
                statCount: "总数",
                step2: "2. 锚定点输入",
                addAnchor: "添加",
                landSize: "土地面积 (Size)",
                priceRate: "价格率 (Rate)",
                generateCurve: "生成 PCHIP 插值曲线",
                chartSectionTitle: "可视化分析",
                legendCurve: "曲线",
                legendAnchor: "锚定点",
                emptyState: "请上传数据并生成图表",
                avgRateTitle: "平均 Price Rate",
                resDataCount: "数据点",
                resAnchorCount: "锚定点",
                downloadResults: "下载结果 (CSV)",
                downloadLookup: "下载逐点表 (CSV)",
                
                // JS Messages & Chart
                alertNoData: "请先上传或输入土地数据。",
                alertAnchors: "请至少提供2个有效的锚定点（数值必须为正数）。",
                chartTitle: "土地价格率曲线 (PCHIP 插值)",
                xAxis: "土地面积 (Land Size)",
                yAxis: "单位面积价格 (Price Rate)",
                seriesCurve: "PCHIP 曲线",
                seriesAnchors: "锚定点",
                seriesAvg: "平均值",
                fileResults: "土地价格率_计算结果.csv",
                fileLookup: "土地价格率_逐点表_300-800.csv",
                zipName: "土地价格率生成器_部署包.zip"
            },
            en: {
                title: "Land Price Rate Generator",
                subtitle: "Land Price Rate PCHIP Generator",
                headerInfo: "PCHIP Monotone Interpolation | Step 1 Lookup (300-800)",
                deployButton: "Deploy App",
                deployTooltip: "Download full project for GitHub Pages",
                langToggle: "中文",
                step1: "1. Upload Land Data",
                uploadText: "Click or Drag to Upload",
                uploadHint: "Supports CSV or Excel (1st column: Land Size)",
                manualInput: "Or Manual Input (One per line)",
                manualInputPlaceholder: "100\n200\n350",
                confirmInput: "Confirm Input",
                statCount: "Count",
                step2: "2. Anchor Points",
                addAnchor: "Add",
                landSize: "Land Size",
                priceRate: "Price Rate",
                generateCurve: "Generate PCHIP Curve",
                chartSectionTitle: "Visualization",
                legendCurve: "Curve",
                legendAnchor: "Anchors",
                emptyState: "Upload data to generate chart",
                avgRateTitle: "Average Price Rate",
                resDataCount: "Data Points",
                resAnchorCount: "Anchors",
                downloadResults: "Download Results (CSV)",
                downloadLookup: "Download Lookup (CSV)",
                
                // JS Messages
                alertNoData: "Please upload or input land data first.",
                alertAnchors: "Please provide at least 2 valid anchor points (positive values).",
                chartTitle: "Land Price Rate Curve (PCHIP)",
                xAxis: "Land Size",
                yAxis: "Price Rate",
                seriesCurve: "PCHIP Curve",
                seriesAnchors: "Anchors",
                seriesAvg: "Average",
                fileResults: "LandPriceRate_Results.csv",
                fileLookup: "LandPriceRate_Lookup_300-800.csv",
                zipName: "LandPriceRate_App_Deploy.zip"
            }
        };

        // --- PCHIP Implementation ---
        const PCHIP = {
            setup: function(x, y) {
                const n = x.length;
                const h = [];
                const d = [];
                for (let i = 0; i < n - 1; i++) {
                    h[i] = x[i + 1] - x[i];
                    d[i] = (y[i + 1] - y[i]) / h[i];
                }

                const m = new Array(n).fill(0);
                if (n === 2) {
                    m[0] = d[0];
                    m[1] = d[0];
                } else {
                    for (let i = 1; i < n - 1; i++) {
                        if (d[i-1] * d[i] <= 0) {
                            m[i] = 0;
                        } else {
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
                    if (xq <= x[0]) {
                        return y[0] + m[0] * (xq - x[0]); // Linear extrapolation
                    } else if (xq >= x[n-1]) {
                        return y[n-1] + m[n-1] * (xq - x[n-1]); // Linear extrapolation
                    } else {
                        for (let i = 0; i < n - 1; i++) {
                            if (xq >= x[i] && xq < x[i + 1]) { k = i; break; }
                        }
                    }
                    const dx = xq - x[k];
                    const t = dx / h[k];
                    const t2 = t * t;
                    const t3 = t2 * t;
                    const h00 = 2 * t3 - 3 * t2 + 1;
                    const h10 = t3 - 2 * t2 + t;
                    const h01 = -2 * t3 + 3 * t2;
                    const h11 = t3 - t2;
                    return h00 * y[k] + h10 * h[k] * m[k] + h01 * y[k + 1] + h11 * h[k] * m[k + 1];
                });
            }
        };

        // --- App State & Language Manager ---
        const State = {
            lang: 'zh',
            uploadedData: [],
            anchors: [
                { size: 100, rate: 1000 },
                { size: 1000, rate: 500 }
            ],
            lastPchipParams: null,
            results: [],
            isChartGenerated: false
        };

        // Helper to get text
        const t = (key) => TRANSLATIONS[State.lang][key] || key;

        function detectLanguage() {
            const saved = localStorage.getItem('appLanguage');
            if (saved && (saved === 'zh' || saved === 'en')) return saved;
            const browser = navigator.language || navigator.userLanguage;
            return browser.startsWith('zh') ? 'zh' : 'en';
        }

        function setLanguage(lang) {
            State.lang = lang;
            localStorage.setItem('appLanguage', lang);
            updateUI();
        }

        function updateUI() {
            // Update static elements
            document.querySelectorAll('[data-i18n]').forEach(el => {
                el.textContent = t(el.getAttribute('data-i18n'));
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
            });
            document.querySelectorAll('[data-i18n-title]').forEach(el => {
                el.title = t(el.getAttribute('data-i18n-title'));
            });

            // Update Toggle Button Text
            const nextLang = State.lang === 'zh' ? 'English' : '中文';
            document.getElementById('currentLangLabel').textContent = nextLang;

            // Update Chart if generated
            if (State.isChartGenerated) {
                generateChart();
            }
        }

        // --- DOM Elements ---
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
            deployFloatBtn: document.getElementById('deployFloatBtn'),
            langToggle: document.getElementById('langToggle')
        };

        // --- Event Listeners & Logic ---

        // Language Toggle
        els.langToggle.onclick = () => {
            const newLang = State.lang === 'zh' ? 'en' : 'zh';
            setLanguage(newLang);
        };

        // Init Anchors
        function renderAnchors() {
            els.anchorsContainer.innerHTML = '';
            State.anchors.forEach((a, idx) => {
                const row = document.createElement('div');
                row.className = 'grid grid-cols-[1fr_1fr_40px] px-3 py-1.5 border-b border-slate-50 items-center gap-2 hover:bg-slate-50 transition-colors';
                row.innerHTML = `
                    <input type="number" step="any" value="${a.size}" onchange="updateAnchor(${idx}, 'size', this.value)" 
                        class="w-full text-xs p-1.5 border border-slate-100 rounded focus:border-blue-400 outline-none" placeholder="Size">
                    <input type="number" step="any" value="${a.rate}" onchange="updateAnchor(${idx}, 'rate', this.value)" 
                        class="w-full text-xs p-1.5 border border-slate-100 rounded focus:border-blue-400 outline-none" placeholder="Rate">
                    <button onclick="removeAnchor(${idx})" class="text-slate-300 hover:text-red-500 transition-colors flex justify-center" ${State.anchors.length <= 2 ? 'disabled' : ''}>
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                `;
                els.anchorsContainer.appendChild(row);
            });
        }

        window.updateAnchor = (idx, field, val) => { State.anchors[idx][field] = parseFloat(val); };
        window.removeAnchor = (idx) => { State.anchors.splice(idx, 1); renderAnchors(); };
        els.addAnchorBtn.onclick = () => { 
            const last = State.anchors[State.anchors.length - 1];
            State.anchors.push({ size: (last ? last.size + 100 : 100), rate: (last ? last.rate : 1000) });
            renderAnchors(); 
        };

        // Data Handling
        function processData(arr) {
            const clean = arr.filter(n => !isNaN(n) && n > 0).sort((a,b) => a-b);
            if (clean.length === 0) return alert(t('alertNoData'));
            State.uploadedData = clean;
            els.dataStatus.classList.remove('hidden');
            els.statCount.textContent = clean.length.toLocaleString();
            els.statMin.textContent = Math.min(...clean).toLocaleString();
            els.statMax.textContent = Math.max(...clean).toLocaleString();
            els.previewData.innerHTML = clean.slice(0, 50).map(v => `<span class="inline-block bg-slate-100 px-1 rounded mr-1 mb-1 border border-slate-200">${v}</span>`).join('');
        }

        els.fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.name.endsWith('.csv')) {
                Papa.parse(file, { complete: (res) => processData(res.data.map(r => parseFloat(r[0]))) });
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
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

        // Generate Logic
        els.generateBtn.onclick = () => {
            if (State.uploadedData.length === 0) return alert(t('alertNoData'));
            const sortedAnchors = [...State.anchors].filter(a => !isNaN(a.size) && !isNaN(a.rate)).sort((a,b) => a.size - b.size);
            if (sortedAnchors.length < 2) return alert(t('alertAnchors'));

            const xNodes = sortedAnchors.map(a => a.size);
            const yNodes = sortedAnchors.map(a => a.rate);
            
            // PCHIP Calc
            const params = PCHIP.setup(xNodes, yNodes);
            State.lastPchipParams = params;
            
            // Calculate Results
            const dataY = PCHIP.evaluate(params, State.uploadedData);
            State.results = State.uploadedData.map((x, i) => ({ x, y: dataY[i] }));
            
            const avg = dataY.reduce((a, b) => a + b, 0) / dataY.length;
            State.avgRate = avg;
            State.xNodes = xNodes;
            State.yNodes = yNodes;
            
            State.isChartGenerated = true;

            // UI Update
            els.resAvgRate.textContent = avg.toLocaleString(undefined, { maximumFractionDigits: 2 });
            els.resDataCount.textContent = State.uploadedData.length;
            els.resAnchorCount.textContent = sortedAnchors.length;
            els.emptyState.classList.add('hidden');
            els.resultsPanel.classList.remove('invisible', 'opacity-0', 'translate-y-4');
            
            generateChart();
        };

        function generateChart() {
            if (!State.isChartGenerated) return;

            const minX = Math.min(...State.uploadedData, State.xNodes[0]);
            const maxX = Math.max(...State.uploadedData, State.xNodes[State.xNodes.length - 1]);
            const plotX = [];
            const steps = 300;
            for(let i=0; i<=steps; i++) plotX.push(minX + (maxX-minX)*(i/steps));
            const plotY = PCHIP.evaluate(State.lastPchipParams, plotX);

            const curve = { 
                x: plotX, 
                y: plotY, 
                mode: 'lines', 
                name: t('seriesCurve'), 
                line: { color: '#2563eb', width: 3 } 
            };
            const anchors = { 
                x: State.xNodes, 
                y: State.yNodes, 
                mode: 'markers', 
                name: t('seriesAnchors'), 
                marker: { color: '#ef4444', size: 10, line: { color: 'white', width: 2 } } 
            };
            const average = { 
                x: [minX, maxX], 
                y: [State.avgRate, State.avgRate], 
                mode: 'lines', 
                name: t('seriesAvg'), 
                line: { color: '#10b981', width: 2, dash: 'dash' } 
            };
            
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

        // CSV Downloads
        els.downloadResultsBtn.onclick = () => {
            if (!State.results.length) return;
            const csv = Papa.unparse(State.results.map(r => ({ "Land Size": r.x, "Land Price Rate": r.y })));
            saveAs(new Blob([csv], { type: 'text/csv' }), t('fileResults'));
        };

        els.downloadLookupBtn.onclick = () => {
            if (!State.lastPchipParams) return;
            const lookups = [];
            for(let x=300; x<=800; x++) {
                lookups.push({ "Land Size": x, "Land Price Rate": PCHIP.evaluate(State.lastPchipParams, [x])[0] });
            }
            saveAs(new Blob([Papa.unparse(lookups)], { type: 'text/csv' }), t('fileLookup'));
        };

        // ZIP Package Generation (Deployment)
        els.deployFloatBtn.onclick = async () => {
            const btn = els.deployFloatBtn;
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<span class="loader border-2 border-white/50 border-t-white w-4 h-4 rounded-full animate-spin"></span>`;
            btn.disabled = true;

            try {
                const zip = new JSZip();
                
                // Construct styles from existing styles
                const styles = document.getElementById('app-styles').textContent;
                
                // Construct logic script
                const logic = document.getElementById('app-logic').textContent;

                // Create the HTML file
                // We recreate a clean index.html that references the separated css/js files we are creating
                const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>Land Price Rate Generator</title>
    <!-- Dependencies -->
    <script src="lib/plotly.min.js"><\/script>
    <script src="lib/papaparse.min.js"><\/script>
    <script src="lib/xlsx.full.min.js"><\/script>
    <script src="lib/jszip.min.js"><\/script>
    <script src="lib/file-saver.min.js"><\/script>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg-slate-50 text-slate-800 h-screen flex flex-col overflow-hidden">
    ${document.body.innerHTML.replace(/<script id="app-logic">[\s\S]*?<\/script>/, '<script src="js/main.js"><\/script>')}
</body>
</html>`;

                zip.file("index.html", htmlContent);
                zip.file(".nojekyll", "");
                
                // Add CSS folder
                zip.folder("css").file("style.css", styles);
                
                // Add JS folder
                zip.folder("js").file("main.js", logic);
                
                // Add Lib folder (Instructions)
                zip.folder("lib").file("README.txt", "For offline use, place local copies of libraries here. By default, CDN links are used in index.html to keep the zip light.");

                // README
                const readme = `# Land Price Rate Generator

A static web application for generating Land Price Rate curves using PCHIP interpolation.

## Features
- Bilingual Support (Chinese/English)
- PCHIP Monotone Interpolation
- Interactive Visualization (Plotly.js)
- One-click Deployment

## Deployment
1. Upload all files to a GitHub Repository.
2. Enable GitHub Pages in Settings > Pages.
3. Done!`;
                zip.file("README.md", readme);

                const content = await zip.generateAsync({ type: "blob" });
                saveAs(content, t('zipName'));
            } catch (err) {
                alert("Error packing project: " + err.message);
            } finally {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        };

        // Init App
        State.lang = detectLanguage();
        renderAnchors();
        updateUI();

    