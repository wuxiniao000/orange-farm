// 助农电商模拟器 - 游戏核心逻辑

// ==================== 游戏状态 ====================
const GameState = {
    money: 1000,
    oranges: 0,
    orangeQuality: 1.0, // 品质倍数
    prosperity: 0,
    day: 1,
    trees: [{ id: 1, mature: true, harvestable: true }],
    nextTreeId: 2,
    storageCap: 100,
    builtFacilities: [],
    rank: '村官',
    rankIndex: 0,
    
    // 解锁状态
    unlocks: {
        juice: false,
        dried: false,
        livestreamBoost: false,
        advancedPricing: false
    },
    
    // 建筑效果缓存
    effects: {
        harvestBonus: 0,
        priceBonus: 0,
        storageBonus: 0,
        prosperityBonus: 0
    }
};

// ==================== 建筑配置 ====================
const Buildings = [
    {
        id: 'road',
        name: '水泥路',
        icon: '🛤️',
        desc: '修路通向外面的世界',
        effect: '采摘效率 +20%',
        cost: 500,
        effectValue: { harvestBonus: 0.2 },
        prosperityAdd: 10
    },
    {
        id: 'warehouse',
        name: '仓库',
        icon: '🏠',
        desc: '扩大存储容量',
        effect: '库存容量 +50',
        cost: 800,
        effectValue: { storageBonus: 50 },
        prosperityAdd: 15
    },
    {
        id: 'network',
        name: '网络基站',
        icon: '📡',
        desc: '让直播更顺畅',
        effect: '直播收入 +15%',
        cost: 1500,
        effectValue: { priceBonus: 0.15 },
        prosperityAdd: 20
    },
    {
        id: 'juice_factory',
        name: '果汁加工厂',
        icon: '🏭',
        desc: '解锁果汁产品',
        effect: '可卖果汁(💰25/瓶)',
        cost: 3000,
        effectValue: { unlock: 'juice' },
        prosperityAdd: 30
    },
    {
        id: 'dried_factory',
        name: '果干加工厂',
        icon: '🏗️',
        desc: '解锁果干产品',
        effect: '可卖果干(💰30/包)',
        cost: 5000,
        effectValue: { unlock: 'dried' },
        prosperityAdd: 40
    },
    {
        id: 'pack_center',
        name: '包装中心',
        icon: '📦',
        desc: '提升产品形象',
        effect: '所有产品价格 +10%',
        cost: 4000,
        effectValue: { priceBonus: 0.1 },
        prosperityAdd: 25
    }
];

// ==================== 官阶配置 ====================
const Ranks = [
    { name: '村官', prosperity: 0 },
    { name: '村支书', prosperity: 100 },
    { name: '副镇长', prosperity: 300 },
    { name: '镇长', prosperity: 600 },
    { name: '副县长', prosperity: 1000 },
    { name: '县长', prosperity: 2000 },
    { name: '副市长', prosperity: 4000 },
    { name: '市长', prosperity: 8000 }
];

// ==================== 随机事件配置 ====================
const RandomEvents = [
    {
        title: '🌧️ 连续阴雨',
        text: '最近雨水太多，耙耙柑甜度下降了。采摘量减少20%。',
        effect: () => { GameState.effects.harvestBonus -= 0.2; },
        negative: true
    },
    {
        title: '☀️ 阳光充足',
        text: '最近天气很好，耙耙柑格外甜！采摘量增加30%。',
        effect: () => { GameState.effects.harvestBonus += 0.3; },
        negative: false
    },
    {
        title: '📺 媒体报道',
        text: '县电视台来采访你的助农事迹，知名度提升！直播观众+50%。',
        effect: () => { GameState.effects.priceBonus += 0.5; },
        negative: false
    },
    {
        title: '🐛 病虫害',
        text: '果园发现害虫，需要花钱治理。',
        effect: () => { 
            const cost = Math.min(GameState.money, 200);
            GameState.money -= cost;
            showToast(`花费 💰${cost} 治理害虫`);
        },
        negative: true
    },
    {
        title: '🌟 网红带货',
        text: '有网红主动来帮忙带货，这次直播收入翻倍！',
        effect: () => { GameState.effects.priceBonus += 1.0; },
        negative: false
    },
    {
        title: '📉 市场波动',
        text: '市场上耙耙柑供应过剩，价格下跌15%。',
        effect: () => { GameState.orangeQuality *= 0.85; },
        negative: true
    },
    {
        title: '💰 政府补贴',
        text: '政府发放助农补贴！',
        effect: () => { 
            const bonus = 500 + Math.floor(GameState.prosperity * 0.5);
            GameState.money += bonus;
            showToast(`获得补贴 💰${bonus}`);
        },
        negative: false
    },
    {
        title: '🏆 获奖喜讯',
        text: '你的耙耙柑获得省级优质农产品奖！所有产品价格+20%。',
        effect: () => { GameState.orangeQuality *= 1.2; },
        negative: false
    }
];

// ==================== UI 元素缓存 ====================
const UI = {
    money: document.getElementById('money'),
    oranges: document.getElementById('oranges'),
    prosperity: document.getElementById('prosperity'),
    prosperityFill: document.getElementById('prosperity-fill'),
    day: document.getElementById('day'),
    treeCount: document.getElementById('tree-count'),
    storageCap: document.getElementById('storage-cap'),
    treeGrid: document.getElementById('tree-grid'),
    buildingsList: document.getElementById('buildings-list'),
    eventLog: document.getElementById('event-log'),
    streamOverlay: document.getElementById('stream-overlay'),
    streamProgress: document.getElementById('stream-progress'),
    viewerCount: document.getElementById('viewer-count'),
    orderCount: document.getElementById('order-count'),
    promotionModal: document.getElementById('promotion-modal'),
    promotionText: document.getElementById('promotion-text'),
    eventModal: document.getElementById('event-modal'),
    eventTitle: document.getElementById('event-title'),
    eventText: document.getElementById('event-text'),
    eventChoices: document.getElementById('event-choices'),
    productSelect: document.getElementById('product-select'),
    priceStrategy: document.getElementById('price-strategy'),
    trafficBuy: document.getElementById('traffic-buy')
};

// ==================== 核心功能 ====================

// 更新UI显示
function updateUI() {
    UI.money.textContent = formatNumber(GameState.money);
    UI.oranges.textContent = formatNumber(GameState.oranges);
    UI.prosperity.textContent = GameState.prosperity;
    UI.prosperityFill.style.width = Math.min(100, (GameState.prosperity / getNextRankProsperity()) * 100) + '%';
    UI.day.textContent = GameState.day;
    UI.treeCount.textContent = GameState.trees.length;
    UI.storageCap.textContent = GameState.storageCap + GameState.effects.storageBonus;
    
    // 更新果树
    renderTrees();
    
    // 检查升官
    checkPromotion();
}

// 格式化数字
function formatNumber(num) {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
}

// 获取下一级需要的繁荣度
function getNextRankProsperity() {
    const nextRank = Ranks[GameState.rankIndex + 1];
    return nextRank ? nextRank.prosperity : Ranks[Ranks.length - 1].prosperity * 2;
}

// 检查升官
function checkPromotion() {
    const nextRank = Ranks[GameState.rankIndex + 1];
    if (nextRank && GameState.prosperity >= nextRank.prosperity) {
        GameState.rankIndex++;
        GameState.rank = nextRank.name;
        showPromotion(nextRank.name);
    }
}

// 显示升官弹窗
function showPromotion(rankName) {
    UI.promotionText.textContent = `你的努力得到了认可！现在你是${rankName}了！`;
    UI.promotionModal.classList.remove('hidden');
}

// 渲染果树
function renderTrees() {
    UI.treeGrid.innerHTML = '';
    GameState.trees.forEach(tree => {
        const treeEl = document.createElement('div');
        treeEl.className = 'tree' + (tree.harvestable ? ' ready' : '');
        treeEl.innerHTML = `
            <div class="tree-icon">${tree.harvestable ? '🌳' : '🌱'}</div>
            <div class="tree-status">${tree.harvestable ? '可采摘' : '生长中'}</div>
        `;
        treeEl.onclick = () => harvestTree(tree);
        UI.treeGrid.appendChild(treeEl);
    });
}

// 采摘单棵树
function harvestTree(tree) {
    if (!tree.harvestable) {
        showToast('这棵树还没成熟');
        return;
    }
    
    const storage = GameState.storageCap + GameState.effects.storageBonus;
    const canHarvest = Math.min(10, storage - GameState.oranges);
    
    if (canHarvest <= 0) {
        showToast('仓库已满！');
        return;
    }
    
    // 计算实际采摘量（含加成）
    const bonus = 1 + GameState.effects.harvestBonus;
    const amount = Math.ceil(canHarvest * bonus);
    
    GameState.oranges += amount;
    tree.harvestable = false;
    
    // 3天后重新成熟
    setTimeout(() => {
        tree.harvestable = true;
        showToast('🍊 有果树成熟了！');
        updateUI();
    }, 10000); // 游戏内10秒=1天，这里简化
    
    logEvent(`采摘了 ${amount} 个耙耙柑`);
    showToast(`+${amount} 🍊`);
    updateUI();
}

// 批量采摘
function harvestAll() {
    const harvestable = GameState.trees.filter(t => t.harvestable);
    if (harvestable.length === 0) {
        showToast('没有可采摘的果树');
        return;
    }
    
    const storage = GameState.storageCap + GameState.effects.storageBonus;
    const canHarvest = storage - GameState.oranges;
    
    if (canHarvest <= 0) {
        showToast('仓库已满！');
        return;
    }
    
    const bonus = 1 + GameState.effects.harvestBonus;
    let total = 0;
    
    harvestable.forEach(tree => {
        if (total < canHarvest) {
            const amount = Math.min(10, canHarvest - total);
            const actual = Math.ceil(amount * bonus);
            total += actual;
            tree.harvestable = false;
            
            setTimeout(() => {
                tree.harvestable = true;
                updateUI();
            }, 10000);
        }
    });
    
    GameState.oranges += total;
    logEvent(`采摘了 ${total} 个耙耙柑`);
    showToast(`+${total} 🍊`);
    updateUI();
}

// 种植新树
function plantTree() {
    const cost = 500;
    if (GameState.money < cost) {
        showToast('资金不足！');
        return;
    }
    
    if (GameState.trees.length >= 9) {
        showToast('果园已满！');
        return;
    }
    
    GameState.money -= cost;
    GameState.trees.push({
        id: GameState.nextTreeId++,
        mature: false,
        harvestable: false
    });
    
    // 新树需要时间成熟
    setTimeout(() => {
        const tree = GameState.trees.find(t => t.id === GameState.nextTreeId - 1);
        if (tree) {
            tree.mature = true;
            tree.harvestable = true;
            showToast('🌳 新果树成熟了！');
            updateUI();
        }
    }, 15000);
    
    logEvent('种植了一棵新果树');
    showToast('种植成功！15秒后成熟');
    updateUI();
}

// 直播带货
function startLivestream() {
    const product = UI.productSelect.value;
    const strategy = UI.priceStrategy.value;
    const traffic = parseInt(UI.trafficBuy.value) || 0;
    
    // 检查库存
    if (GameState.oranges <= 0) {
        showToast('没有耙耙柑可卖！');
        return;
    }
    
    // 检查资金
    if (GameState.money < traffic) {
        showToast('资金不足以投放流量！');
        return;
    }
    
    // 扣除流量费
    GameState.money -= traffic;
    
    // 显示直播动画
    UI.streamOverlay.classList.remove('hidden');
    
    let progress = 0;
    let viewers = 100 + traffic;
    let orders = 0;
    let revenue = 0;
    
    const basePrice = 10;
    let price = basePrice;
    let sellRate = 1;
    
    // 定价策略
    if (strategy === 'low') {
        price = basePrice * 0.8;
        sellRate = 1.5;
    } else if (strategy === 'high') {
        price = basePrice * 1.5;
        sellRate = 0.7;
    }
    
    // 加成计算
    price *= GameState.orangeQuality;
    price *= (1 + GameState.effects.priceBonus);
    
    price = Math.round(price);
    
    // 直播动画
    const interval = setInterval(() => {
        progress += 2;
        UI.streamProgress.style.width = progress + '%';
        
        // 随机增加观众
        viewers += Math.floor(Math.random() * 20 + traffic / 50);
        UI.viewerCount.textContent = viewers;
        
        // 随机下单
        const newOrders = Math.floor(Math.random() * 5 * sellRate);
        orders += newOrders;
        UI.orderCount.textContent = orders;
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // 结算
            const sellAmount = Math.min(orders, GameState.oranges);
            revenue = sellAmount * price;
            
            GameState.oranges -= sellAmount;
            GameState.money += revenue;
            
            // 增加繁荣度
            const prosperityGain = Math.floor(sellAmount / 10) + Math.floor(revenue / 100);
            GameState.prosperity += prosperityGain;
            
            // 下一天
            nextDay();
            
            // 隐藏动画，显示结果
            setTimeout(() => {
                UI.streamOverlay.classList.add('hidden');
                logEvent(`直播结束！卖了 ${sellAmount} 个耙耙柑，收入 💰${revenue}，繁荣度 +${prosperityGain}`);
                showToast(`直播收入: 💰${revenue}`);
                updateUI();
            }, 500);
        }
    }, 50);
}

// 下一天
function nextDay() {
    GameState.day++;
    
    // 随机事件 (20%概率)
    if (Math.random() < 0.2) {
        triggerRandomEvent();
    }
    
    // 恢复效果
    GameState.effects.harvestBonus = 0;
    GameState.effects.priceBonus = GameState.builtFacilities.includes('network') ? 0.15 : 0;
    GameState.orangeQuality = 1.0;
}

// 触发随机事件
function triggerRandomEvent() {
    const event = RandomEvents[Math.floor(Math.random() * RandomEvents.length)];
    
    UI.eventTitle.textContent = event.title;
    UI.eventText.textContent = event.text;
    UI.eventChoices.innerHTML = `
        <button class="btn primary" onclick="closeEventModal(true)">确定</button>
    `;
    UI.eventModal.classList.remove('hidden');
    
    // 存储事件效果
    window.currentEvent = event;
}

// 关闭事件弹窗
function closeEventModal(confirmed) {
    if (confirmed && window.currentEvent) {
        window.currentEvent.effect();
    }
    UI.eventModal.classList.add('hidden');
    window.currentEvent = null;
    updateUI();
}

// 渲染建筑列表
function renderBuildings() {
    UI.buildingsList.innerHTML = '';
    
    Buildings.forEach(building => {
        const built = GameState.builtFacilities.includes(building.id);
        const canBuild = GameState.money >= building.cost && !built;
        
        const card = document.createElement('div');
        card.className = 'building-card' + (built ? ' built' : '');
        card.innerHTML = `
            <div class="building-header">
                <span class="building-name">${building.name}</span>
                <span class="building-icon">${building.icon}</span>
            </div>
            <div class="building-desc">${building.desc}</div>
            <div class="building-effect">${building.effect}</div>
            <div class="building-cost">${built ? '✅ 已建造' : '💰 ' + formatNumber(building.cost)}</div>
            ${!built ? `<button class="btn ${canBuild ? 'primary' : 'secondary'} building-btn" 
                ${canBuild ? '' : 'disabled'} 
                onclick="buildFacility('${building.id}')">
                ${canBuild ? '建造' : '资金不足'}
            </button>` : ''}
        `;
        UI.buildingsList.appendChild(card);
    });
}

// 建造设施
function buildFacility(id) {
    const building = Buildings.find(b => b.id === id);
    if (!building) return;
    
    if (GameState.money < building.cost) {
        showToast('资金不足！');
        return;
    }
    
    GameState.money -= building.cost;
    GameState.builtFacilities.push(id);
    GameState.prosperity += building.prosperityAdd;
    
    // 应用效果
    if (building.effectValue.harvestBonus) {
        GameState.effects.harvestBonus += building.effectValue.harvestBonus;
    }
    if (building.effectValue.storageBonus) {
        GameState.effects.storageBonus += building.effectValue.storageBonus;
    }
    if (building.effectValue.priceBonus) {
        GameState.effects.priceBonus += building.effectValue.priceBonus;
    }
    if (building.effectValue.unlock) {
        GameState.unlocks[building.effectValue.unlock] = true;
        // 更新产品选择
        updateProductOptions();
    }
    
    logEvent(`建造了 ${building.name}！繁荣度 +${building.prosperityAdd}`);
    showToast(`🎉 ${building.name} 建造完成！`);
    renderBuildings();
    updateUI();
}

// 更新产品选项
function updateProductOptions() {
    const juiceOption = UI.productSelect.querySelector('option[value="juice"]');
    const driedOption = UI.productSelect.querySelector('option[value="dried"]');
    
    if (GameState.unlocks.juice) {
        juiceOption.disabled = false;
        juiceOption.textContent = '果汁 (💰25/瓶)';
    }
    if (GameState.unlocks.dried) {
        driedOption.disabled = false;
        driedOption.textContent = '果干 (💰30/包)';
    }
}

// 添加日志
function logEvent(text) {
    const p = document.createElement('p');
    p.innerHTML = `<span style="color: #888;">第${GameState.day}天:</span> ${text}`;
    UI.eventLog.insertBefore(p, UI.eventLog.firstChild);
    
    // 保持最近5条
    while (UI.eventLog.children.length > 5) {
        UI.eventLog.removeChild(UI.eventLog.lastChild);
    }
}

// 显示提示
function showToast(text) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = text;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ==================== 事件绑定 ====================
document.getElementById('btn-harvest').addEventListener('click', harvestAll);
document.getElementById('btn-plant').addEventListener('click', plantTree);
document.getElementById('btn-stream').addEventListener('click', startLivestream);
document.getElementById('btn-close-promotion').addEventListener('click', () => {
    UI.promotionModal.classList.add('hidden');
});

// ==================== 初始化 ====================
function init() {
    updateUI();
    renderBuildings();
    
    // 初始果树成熟
    GameState.trees[0].harvestable = true;
    
    logEvent('欢迎来到阳光村！点击"采摘耙耙柑"开始你的助农之旅。');
}

// 启动游戏
init();