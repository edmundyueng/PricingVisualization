// --- Translations ---
const TRANSLATIONS = {
    zh: {
        title: "土地价格率生成器",
        subtitle: "Land Price Rate PCHIP Generator",
        headerInfo: "PCHIP 单调插值 | 步长 1 逐点表 (300-800)",
        deployTooltip: "下载完整项目",
        langToggle: "English",
        step1: "1. 上传土地面积数据",
        uploadText: "点击或拖拽上传文件",
        uploadHint: "支持 CSV 或 Excel (第一列为 Land Size)",
        manualInput: "或手动输入数据",
        confirmInput: "确认",
        statCount: "总数",
        step2: "2. 锚定点输入",
        addAnchor: "添加",
        landSize: "土地面积",
        priceRate: "价格率",
        step3: "3. 图表设置",
        binSizeLabel: "面积区间大小 (Bin Size)",
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
        tabCurve: "价格率曲线 (Rate)",
        tabDist: "总价与库存分布 (Distribution)",
        distChartTitle: "面积区间分布与总价估算",
        xAxisBin: "土地面积区间 (Size Bin)",
        yAxisCount: "地块数量 (Lots)",
        yAxisAvgPrice: "平均总价 ($)",
        seriesLotCount: "地块数量",
        seriesAvgPrice: "平均总价",
        minPrice: "最低价",
        maxPrice: "最高价",
        alertNoData: "请先上传土地数据。",
        alertAnchors: "请至少提供2个有效的锚定点。",
        chartTitle: "土地价格率曲线 (PCHIP)",
        xAxis: "土地面积 (Land Size)",
        yAxis: "单位面积价格 (Price Rate)",
        seriesCurve: "PCHIP 曲线",
        seriesAnchors: "锚定点",
        seriesAvg: "平均值",
        fileResults: "土地价格结果.csv",
        fileLookup: "逐点表_300-800.csv",
        zipName: "Project_Deploy.zip"
    },
    en: {
        title: "Land Price Rate Generator",
        subtitle: "Land Price Rate PCHIP Generator",
        headerInfo: "PCHIP Monotone Interpolation",
        deployTooltip: "Download full project",
        langToggle: "中文",
        step1: "1. Upload Land Data",
        uploadText: "Click or Drag to Upload",
        uploadHint: "Supports CSV or Excel",
        manualInput: "Or Manual Input",
        confirmInput: "Confirm",
        statCount: "Count",
        step2: "2. Anchor Points",
        addAnchor: "Add",
        landSize: "Land Size",
        priceRate: "Price Rate",
        step3: "3. Chart Settings",
        binSizeLabel: "Bin Size (Land Size)",
        generateCurve: "Generate PCHIP Curve",
        chartSectionTitle: "Visualization",
        legendCurve: "Curve",
        legendAnchor: "Anchors",
        emptyState: "Upload data to generate chart",
        avgRateTitle: "Average Price Rate",
        resDataCount: "Data Points",
        resAnchorCount: "Anchors",
        downloadResults: "Download (CSV)",
        downloadLookup: "Lookup (CSV)",
        tabCurve: "Price Rate Curve",
        tabDist: "Price & Distribution",
        distChartTitle: "Land Size Bins & Estimated Price",
        xAxisBin: "Land Size Bin",
        yAxisCount: "Number of Lots",
        yAxisAvgPrice: "Average Price ($)",
        seriesLotCount: "Lot Count",
        seriesAvgPrice: "Average Price",
        minPrice: "Min Price",
        maxPrice: "Max Price",
        alertNoData: "Please upload land data first.",
        alertAnchors: "At least 2 anchor points required.",
        chartTitle: "Land Price Rate Curve (PCHIP)",
        xAxis: "Land Size",
        yAxis: "Price Rate",
        seriesCurve: "PCHIP Curve",
        seriesAnchors: "Anchors",
        seriesAvg: "Average",
        fileResults: "Results.csv",
        fileLookup: "Lookup_300-800.csv",
        zipName: "Project_Deploy.zip"
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
                if (d[i-1] * d[i] <= 0) { m[i] = 0; }
                else {
                    const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
                    m[i] = (w1 + w2) / (w1 / d[i-1] + w2 / d[i]);
                }
            }
            m[0] = ((2*h[0]+h[1])*d[0] - h[0]*d[1]) / (h[0]+h[1]);
            if (Math.sign(m[0]) !== Math.sign(d[0])) m[0] = 0;
            m[n-1] = ((2*h[n-2]+h[n-3])*d[n-2] - h[n-2]*d[n-3]) / (h[n-2]+h[n-3]);
            if (Math.sign(m[n-1]) !== Math.sign(d[n-2])) m[n-1] = 0;
        }
        return { x, y, m, h };
    },
    evaluate: function(params, queryPoints) {
        const { x, y, m, h } = params;
        const n = x.length;
        return queryPoints.map(xq => {
            let k = 0;
            if (xq <= x[0]) return y[0] + m[0] * (xq - x[0]);
            if (xq >= x[n-1]) return y[n-1] + m[n-1] * (xq - x[n-1]);
            for (let i = 0; i < n - 1; i++) { if (xq >= x[i] && xq < x[i + 1]) { k = i; break; } }
            const dx = xq - x[k], t = dx / h[k], t2 = t * t, t3 = t2 * t;
            return (2*t3-3*t2+1)*y[k] + (t3-2*t2+t)*h[k]*m[k] + (-2*t3+3*t2)*y[k+1] + (t3-t2)*h[k]*m[k+1];
        });
    }
};

// --- State ---
const State = {
    lang: 'zh',
    uploadedData: [],
    anchors: [{ size: 375, rate: 690 }, { size: 450, rate: 645 }, { size: 550, rate: 625 }, { size: 600, rate: 620 }],
    lastPchipParams: null,
    results: [],
    binSize: 50, // 默认 Bin Size
    isChartGenerated: false
};

const t = (key) => TRANSLATIONS[State.lang][key] || key;

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
    binSizeInput: document.getElementById('binSizeInput'),
    generateBtn: document.getElementById('generateBtn'),
    chartDiv: document.getElementById('chartDiv'),
    distChartDiv: document.getElementById('distChartDiv'),
    tabCurve: document.getElementById('tabCurve'),
    tabDist: document.getElementById('tabDist'),
    legendCurve: document.getElementById('legendCurve'),
    emptyState: document.getElementById('emptyState'),
    resultsPanel: document.getElementById('resultsPanel'),
    resAvgRate: document.getElementById('resAvgRate'),
    resDataCount: document.getElementById('resDataCount'),
    resAnchorCount: document.getElementById('resAnchorCount'),
    downloadResultsBtn: document.getElementById('downloadResultsBtn'),
    downloadLookupBtn: document.getElementById('downloadLookupBtn'),
    deployFloatBtn: document.getElementById('deployFloatBtn'),
    langToggle: document.getElementById('langToggle'),
    currentLangLabel: document.getElementById('currentLangLabel')
};

// --- UI Logic ---
function updateUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n')));
    els.currentLangLabel.textContent = State.lang === 'zh' ? 'English' : '中文';
    if (State.isChartGenerated) generateChart();
}

els.langToggle.onclick = () => { State.lang = State.lang === 'zh' ? 'en' : 'zh'; updateUI(); };

// 监听 Bin Size 实时修改
els.binSizeInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    if (val > 0) {
        State.binSize = val;
        // 如果图表已经生成过了，输入时实时重新渲染
        if (State.isChartGenerated) {
            generateChart();
        }
    }
});

function renderAnchors() {
    els.anchorsContainer.innerHTML = '';
    State.anchors.forEach((a, idx) => {
        const row = document.createElement('div');
        row.className = 'grid grid-cols-[1fr_1fr_40px] px-3 py-1.5 border-b border-slate-50 items-center gap-2 hover:bg-slate-50';
        row.innerHTML = `
            <input type="number" value="${a.size}" onchange="updateAnchor(${idx}, 'size', this.value)" class="w-full text-xs p-1.5 border border-slate-100 rounded">
            <input type="number" value="${a.rate}" onchange="updateAnchor(${idx}, 'rate', this.value)" class="w-full text-xs p-1.5 border border-slate-100 rounded">
            <button onclick="removeAnchor(${idx})" class="text-slate-300 hover:text-red-500 flex justify-center" ${State.anchors.length <= 2 ? 'disabled' : ''}>
                <span class="material-symbols-outlined text-base">delete</span>
            </button>`;
        els.anchorsContainer.appendChild(row);
    });
}

window.updateAnchor = (idx, field, val) => { State.anchors[idx][field] = parseFloat(val); };
window.removeAnchor = (idx) => { State.anchors.splice(idx, 1); renderAnchors(); };
els.addAnchorBtn.onclick = () => { 
    const last = State.anchors[State.anchors.length - 1];
    State.anchors.push({ size: last.size + 50, rate: last.rate - 10 });
    renderAnchors(); 
};

function processData(arr) {
    const clean = arr.filter(n => !isNaN(n) && n > 0).sort((a,b) => a-b);
    if (!clean.length) return alert(t('alertNoData'));
    State.uploadedData = clean;
    els.dataStatus.classList.remove('hidden');
    els.statCount.textContent = clean.length;
    els.statMin.textContent = Math.min(...clean);
    els.statMax.textContent = Math.max(...clean);
    els.previewData.innerHTML = clean.slice(0, 50).map(v => `<span class="inline-block bg-slate-100 px-1 rounded mr-1 mb-1 border">${v}</span>`).join('');
}

els.fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.name.endsWith('.csv')) { Papa.parse(file, { complete: (res) => processData(res.data.map(r => parseFloat(r[0]))) }); }
    else {
        const reader = new FileReader();
        reader.onload = (e) => {
            const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            processData(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }).map(r => parseFloat(r[0])));
        };
        reader.readAsArrayBuffer(file);
    }
};

els.toggleManual.onclick = () => els.manualContainer.classList.toggle('hidden');
els.processManualBtn.onclick = () => { processData(els.manualInput.value.split(/[\n,]+/).map(s => parseFloat(s.trim()))); els.manualContainer.classList.add('hidden'); };

function switchTab(activeTab) {
    const activeClass = "px-4 py-1.5 text-xs font-bold bg-white text-blue-600 rounded-md shadow-sm transition-all";
    const inactiveClass = "px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-all";
    if (activeTab === 'curve') {
        els.tabCurve.className = activeClass; els.tabDist.className = inactiveClass;
        els.chartDiv.classList.remove('invisible', 'opacity-0'); els.distChartDiv.classList.add('invisible', 'opacity-0');
        els.legendCurve.classList.remove('hidden');
    } else {
        els.tabDist.className = activeClass; els.tabCurve.className = inactiveClass;
        els.distChartDiv.classList.remove('invisible', 'opacity-0'); els.chartDiv.classList.add('invisible', 'opacity-0');
        els.legendCurve.classList.add('hidden');
    }
}
els.tabCurve.onclick = () => switchTab('curve');
els.tabDist.onclick = () => switchTab('dist');

els.generateBtn.onclick = () => {
    if (!State.uploadedData.length) return alert(t('alertNoData'));
    const sorted = [...State.anchors].sort((a,b) => a.size - b.size);
    State.lastPchipParams = PCHIP.setup(sorted.map(a=>a.size), sorted.map(a=>a.rate));
    const dataY = PCHIP.evaluate(State.lastPchipParams, State.uploadedData);
    State.results = State.uploadedData.map((x, i) => ({ x, y: dataY[i] }));
    State.avgRate = dataY.reduce((a,b)=>a+b,0)/dataY.length;
    State.isChartGenerated = true;
    els.resAvgRate.textContent = State.avgRate.toFixed(2);
    els.resDataCount.textContent = State.uploadedData.length;
    els.resAnchorCount.textContent = State.anchors.length;
    els.emptyState.classList.add('hidden');
    els.resultsPanel.classList.remove('invisible', 'opacity-0');
    generateChart();
};

function generateChart() {
    if (!State.isChartGenerated) return;
    const minX = Math.min(...State.uploadedData), maxX = Math.max(...State.uploadedData);
    
    // 1. 生成第一张图：PCHIP 价格率曲线
    const plotX = []; for(let i=0; i<=200; i++) plotX.push(minX + (maxX-minX)*(i/200));
    const plotY = PCHIP.evaluate(State.lastPchipParams, plotX);

    Plotly.newPlot(els.chartDiv, [
        { x: plotX, y: plotY, mode: 'lines', name: t('seriesCurve'), line: { color: '#2563eb', width: 3 } },
        { x: State.anchors.map(a=>a.size), y: State.anchors.map(a=>a.rate), mode: 'markers', name: t('seriesAnchors'), marker: { color: '#ef4444', size: 10 } },
        { x: [minX, maxX], y: [State.avgRate, State.avgRate], mode: 'lines', name: t('seriesAvg'), line: { dash: 'dash', color: '#10b981' } }
    ], { title: t('chartTitle'), margin: { t: 40, b: 40, l: 50, r: 20 }, hovermode: 'closest' }, { responsive: true, displayModeBar: false });

    // 2. 生成第二张图：Bin 分布与上下双半轴图 (Diverging Bar Chart)
    const sizes = State.results.map(r => r.x);
    
    // 使用用户在 UI 上的 Bin Size
    let step = State.binSize;
    if (!step || step <= 0) step = 50;

    const minBin = Math.floor(minX / step) * step;
    const maxBin = Math.ceil(maxX / step) * step;

    const bins = [];
    for (let b = minBin; b < maxBin; b += step) {
        bins.push({ label: `${b}-${b+step}`, count: 0, prices: [] });
    }

    State.results.forEach(item => {
        const price = item.x * item.y; // 土地面积 × 价格率 = 估算总价
        let bIdx = Math.floor((item.x - minBin) / step);
        if (bIdx >= bins.length) bIdx = bins.length - 1;
        if (bIdx < 0) bIdx = 0;
        bins[bIdx].count++;
        bins[bIdx].prices.push(price);
    });

    const xLabels = [], counts = [], avgPrices = [], customDataPrice = [];

    bins.forEach(b => {
        xLabels.push(b.label);
        counts.push(b.count);
        if (b.count > 0) {
            avgPrices.push(b.prices.reduce((a,c)=>a+c, 0) / b.count);
            customDataPrice.push([Math.min(...b.prices), Math.max(...b.prices)]); // 注入 Min & Max 数据
        } else {
            avgPrices.push(0);
            customDataPrice.push([0, 0]);
        }
    });

    // 顶部正数区：平均总价 (Bar Chart)
    const tracePrice = {
        x: xLabels,
        y: avgPrices,
        type: 'bar',
        name: t('seriesAvgPrice'),
        marker: { color: '#3b82f6', opacity: 0.9 }, // 蓝色系
        customdata: customDataPrice,
        hovertemplate: '<b>Bin: %{x}</b><br>' + 
                       t('seriesAvgPrice') + ': $%{y:,.0f}<br>' + 
                       t('minPrice') + ': $%{customdata[0]:,.0f}<br>' + 
                       t('maxPrice') + ': $%{customdata[1]:,.0f}<extra></extra>',
        yaxis: 'y'
    };

    // 底部负数区：地块数量 (Bar Chart 向下悬挂)
    const traceCount = {
        x: xLabels,
        y: counts,
        type: 'bar',
        name: t('seriesLotCount'),
        marker: { color: '#f59e0b', opacity: 0.9 }, // 橙色系
        yaxis: 'y2',
        hovertemplate: '<b>Bin: %{x}</b><br>' + 
                       t('seriesLotCount') + ': %{y}<extra></extra>'
    };

    const distLayout = {
        title: t('distChartTitle'),
        margin: { t: 40, r: 40, l: 60, b: 60 },
        barmode: 'group',
        xaxis: {
            title: t('xAxisBin'),
            anchor: 'y2', // 将 X轴文字标签固定在最底部
            tickangle: -45,
            gridcolor: '#f1f5f9'
        },
        yaxis: {
            title: t('yAxisAvgPrice'),
            domain: [0.5, 1], // 占据上半个图表
            rangemode: 'tozero',
            gridcolor: '#e2e8f0'
        },
        yaxis2: {
            title: t('yAxisCount'),
            domain: [0, 0.5], // 占据下半个图表
            autorange: 'reversed', // 关键！让下半区的0值贴合中心轴，柱子向下生长
            rangemode: 'tozero',
            gridcolor: '#e2e8f0'
        },
        showlegend: true,
        legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.1 }
    };

    Plotly.newPlot(els.distChartDiv, [tracePrice, traceCount], distLayout, { responsive: true, displayModeBar: false });
}

els.downloadResultsBtn.onclick = () => saveAs(new Blob([Papa.unparse(State.results.map(r=>({"Size":r.x, "Rate":r.y, "Total Price":r.x*r.y})))], {type:'text/csv'}), t('fileResults'));
els.downloadLookupBtn.onclick = () => {
    const l = []; for(let i=300; i<=800; i++) l.push({"Size":i, "Rate":PCHIP.evaluate(State.lastPchipParams, [i])[0]});
    saveAs(new Blob([Papa.unparse(l)], {type:'text/csv'}), t('fileLookup'));
};

renderAnchors();
updateUI();
