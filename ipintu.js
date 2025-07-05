// 全局变量
let uploadedImages = [];
let currentLayoutIndex = 0;
let isGenerating = false;

const layouts = [
    { id: 'grid', name: '网格布局', color: 'from-blue-500 to-purple-600' },
    { id: 'main-side', name: '主图布局', color: 'from-green-500 to-teal-600' },
    { id: 'mosaic', name: '艺术拼贴', color: 'from-pink-500 to-rose-600' },
    { id: 'vertical', name: '垂直叠加', color: 'from-orange-500 to-yellow-600' },
    { id: 'horizontal', name: '水平展开', color: 'from-indigo-500 to-blue-600' }
];

// DOM 元素
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const imageGrid = document.getElementById('imageGrid');
const imageCount = document.getElementById('imageCount');
const generateBtn = document.getElementById('generateBtn');
const switchLayoutBtn = document.getElementById('switchLayoutBtn');
const exportBtn = document.getElementById('exportBtn');
const currentLayout = document.getElementById('currentLayout');
const puzzlePreview = document.getElementById('puzzlePreview');
const puzzleCanvas = document.getElementById('puzzleCanvas');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initEventListeners);

// 初始化事件监听
function initEventListeners() {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    generateBtn.addEventListener('click', generatePuzzle);
    switchLayoutBtn.addEventListener('click', switchLayout);
    exportBtn.addEventListener('click', exportImage);
}

// 拖拽处理
function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
}

// 处理文件上传
function handleFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (uploadedImages.length + imageFiles.length > 10) {
        alert('最多只能上传10张图片');
        return;
    }

    imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const imageData = {
                    id: Date.now() + Math.random(),
                    file: file,
                    url: e.target.result,
                    img: img,
                    width: img.width,
                    height: img.height
                };
                uploadedImages.push(imageData);
                updateImagePreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 更新图片预览
function updateImagePreview() {
    if (uploadedImages.length === 0) {
        imagePreview.classList.add('hidden');
        return;
    }

    imagePreview.classList.remove('hidden');
    imageCount.querySelector('span').textContent = `${uploadedImages.length} 张图片`;
    
    imageGrid.innerHTML = '';
    uploadedImages.forEach((image, index) => {
        const div = document.createElement('div');
        div.className = 'relative group';
        div.innerHTML = `
            <div class="image-preview relative overflow-hidden rounded-2xl bg-white shadow-lg">
                <img src="${image.url}" alt="预览 ${index + 1}" class="w-full h-24 object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <button onclick="removeImage('${image.id}')" class="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
        imageGrid.appendChild(div);
    });
}

// 删除图片
function removeImage(id) {
    uploadedImages = uploadedImages.filter(img => img.id !== id);
    updateImagePreview();
    puzzlePreview.classList.add('hidden');
}

// 切换布局
function switchLayout() {
    if (uploadedImages.length === 0) return;
    
    currentLayoutIndex = (currentLayoutIndex + 1) % layouts.length;
    const layout = layouts[currentLayoutIndex];
    
    currentLayout.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>
        ${layout.name}
    `;
    currentLayout.className = `px-4 py-2 bg-gradient-to-r ${layout.color} text-white rounded-xl font-medium flex items-center gap-2`;
}

// 生成拼图
function generatePuzzle() {
    if (uploadedImages.length === 0) {
        alert('请先上传图片');
        return;
    }

    if (isGenerating) return;
    
    isGenerating = true;
    generateBtn.innerHTML = '<div class="loading">正在生成...</div>';
    generateBtn.disabled = true;

    // 延迟执行以显示加载状态
    setTimeout(() => {
        const ctx = puzzleCanvas.getContext('2d');
        const canvasWidth = 1200;
        const canvasHeight = 800;
        
        puzzleCanvas.width = canvasWidth;
        puzzleCanvas.height = canvasHeight;

        // 创建渐变背景
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 根据布局类型绘制
        const layout = layouts[currentLayoutIndex];
        switch (layout.id) {
            case 'grid':
                drawGridLayout(ctx, canvasWidth, canvasHeight);
                break;
            case 'main-side':
                drawMainSideLayout(ctx, canvasWidth, canvasHeight);
                break;
            case 'mosaic':
                drawMosaicLayout(ctx, canvasWidth, canvasHeight);
                break;
            case 'vertical':
                drawVerticalLayout(ctx, canvasWidth, canvasHeight);
                break;
            case 'horizontal':
                drawHorizontalLayout(ctx, canvasWidth, canvasHeight);
                break;
        }

        puzzlePreview.classList.remove('hidden');
        isGenerating = false;
        generateBtn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span>生成拼图</span>
        `;
        generateBtn.disabled = false;
    }, 1000);
}

// 绘制圆角矩形
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// 绘制网格布局
function drawGridLayout(ctx, canvasWidth, canvasHeight) {
    const cols = Math.ceil(Math.sqrt(uploadedImages.length));
    const rows = Math.ceil(uploadedImages.length / cols);
    const cellWidth = canvasWidth / cols;
    const cellHeight = canvasHeight / rows;
    const padding = 8;

    uploadedImages.forEach((image, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = col * cellWidth + padding;
        const y = row * cellHeight + padding;
        const width = cellWidth - padding * 2;
        const height = cellHeight - padding * 2;

        // 绘制白色背景
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        drawRoundedRect(ctx, x, y, width, height, 12);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // 绘制图片
        const img = image.img;
        const scale = Math.min(width / img.width, height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        ctx.save();
        drawRoundedRect(ctx, x + 8, y + 8, width - 16, height - 16, 8);
        ctx.clip();
        ctx.drawImage(img, x + 8 + offsetX, y + 8 + offsetY, scaledWidth, scaledHeight);
        ctx.restore();
    });
}

// 绘制主图布局
function drawMainSideLayout(ctx, canvasWidth, canvasHeight) {
    if (uploadedImages.length === 0) return;

    const padding = 12;
    const mainWidth = canvasWidth * 0.65;
    const sideWidth = canvasWidth * 0.35 - padding * 2;
    const sideHeight = (canvasHeight - padding * (uploadedImages.length - 1)) / Math.max(1, uploadedImages.length - 1);

    // 绘制主图
    const mainImage = uploadedImages[0];
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    drawRoundedRect(ctx, padding, padding, mainWidth - padding * 2, canvasHeight - padding * 2, 16);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.save();
    drawRoundedRect(ctx, padding * 2, padding * 2, mainWidth - padding * 4, canvasHeight - padding * 4, 12);
    ctx.clip();
    
    const mainScale = Math.min((mainWidth - padding * 4) / mainImage.img.width, (canvasHeight - padding * 4) / mainImage.img.height);
    const mainScaledWidth = mainImage.img.width * mainScale;
    const mainScaledHeight = mainImage.img.height * mainScale;
    const mainOffsetX = (mainWidth - padding * 4 - mainScaledWidth) / 2;
    const mainOffsetY = (canvasHeight - padding * 4 - mainScaledHeight) / 2;
    
    ctx.drawImage(mainImage.img, padding * 2 + mainOffsetX, padding * 2 + mainOffsetY, mainScaledWidth, mainScaledHeight);
    ctx.restore();

    // 绘制侧边图片
    for (let i = 1; i < uploadedImages.length; i++) {
        const image = uploadedImages[i];
        const y = padding + (i - 1) * (sideHeight + padding);
        const x = mainWidth + padding;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        drawRoundedRect(ctx, x, y, sideWidth, sideHeight, 12);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.save();
        drawRoundedRect(ctx, x + 8, y + 8, sideWidth - 16, sideHeight - 16, 8);
        ctx.clip();
        
        const scale = Math.min((sideWidth - 16) / image.img.width, (sideHeight - 16) / image.img.height);
        const scaledWidth = image.img.width * scale;
        const scaledHeight = image.img.height * scale;
        const offsetX = (sideWidth - 16 - scaledWidth) / 2;
        const offsetY = (sideHeight - 16 - scaledHeight) / 2;
        
        ctx.drawImage(image.img, x + 8 + offsetX, y + 8 + offsetY, scaledWidth, scaledHeight);
        ctx.restore();
    }
}

// 绘制艺术拼贴布局
function drawMosaicLayout(ctx, canvasWidth, canvasHeight) {
    const padding = 15;
    const positions = [];
    
    // 生成随机位置但避免重叠
    for (let i = 0; i < uploadedImages.length; i++) {
        let attempts = 0;
        let position;
        
        do {
            const size = 150 + Math.random() * 100;
            position = {
                x: padding + Math.random() * (canvasWidth - size - padding * 2),
                y: padding + Math.random() * (canvasHeight - size - padding * 2),
                width: size,
                height: size,
                rotation: (Math.random() - 0.5) * 0.3
            };
            attempts++;
        } while (attempts < 50 && positions.some(p => 
            Math.abs(p.x - position.x) < Math.max(p.width, position.width) * 0.7 &&
            Math.abs(p.y - position.y) < Math.max(p.height, position.height) * 0.7
        ));
        
        positions.push(position);
    }

    uploadedImages.forEach((image, index) => {
        const pos = positions[index];
        
        ctx.save();
        ctx.translate(pos.x + pos.width / 2, pos.y + pos.height / 2);
        ctx.rotate(pos.rotation);
        
        // 绘制阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // 绘制白色背景
        ctx.fillStyle = '#ffffff';
        drawRoundedRect(ctx, -pos.width / 2, -pos.height / 2, pos.width, pos.height, 16);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        
        // 绘制图片
        drawRoundedRect(ctx, -pos.width / 2 + 10, -pos.height / 2 + 10, pos.width - 20, pos.height - 20, 12);
        ctx.clip();
        
        const scale = Math.min((pos.width - 20) / image.img.width, (pos.height - 20) / image.img.height);
        const scaledWidth = image.img.width * scale;
        const scaledHeight = image.img.height * scale;
        
        ctx.drawImage(image.img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        ctx.restore();
    });
}

// 绘制垂直布局
function drawVerticalLayout(ctx, canvasWidth, canvasHeight) {
    const padding = 10;
    const imageHeight = (canvasHeight - padding * (uploadedImages.length + 1)) / uploadedImages.length;
    const imageWidth = canvasWidth - padding * 2;

    uploadedImages.forEach((image, index) => {
        const y = padding + index * (imageHeight + padding);
        const x = padding;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;
        drawRoundedRect(ctx, x, y, imageWidth, imageHeight, 16);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.save();
        drawRoundedRect(ctx, x + 12, y + 12, imageWidth - 24, imageHeight - 24, 12);
        ctx.clip();
        
        const scale = Math.min((imageWidth - 24) / image.img.width, (imageHeight - 24) / image.img.height);
        const scaledWidth = image.img.width * scale;
        const scaledHeight = image.img.height * scale;
        const offsetX = (imageWidth - 24 - scaledWidth) / 2;
        const offsetY = (imageHeight - 24 - scaledHeight) / 2;
        
        ctx.drawImage(image.img, x + 12 + offsetX, y + 12 + offsetY, scaledWidth, scaledHeight);
        ctx.restore();
    });
}

// 绘制水平布局
function drawHorizontalLayout(ctx, canvasWidth, canvasHeight) {
    const padding = 10;
    const imageWidth = (canvasWidth - padding * (uploadedImages.length + 1)) / uploadedImages.length;
    const imageHeight = canvasHeight - padding * 2;

    uploadedImages.forEach((image, index) => {
        const x = padding + index * (imageWidth + padding);
        const y = padding;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;
        drawRoundedRect(ctx, x, y, imageWidth, imageHeight, 16);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.save();
        drawRoundedRect(ctx, x + 12, y + 12, imageWidth - 24, imageHeight - 24, 12);
        ctx.clip();
        
        const scale = Math.min((imageWidth - 24) / image.img.width, (imageHeight - 24) / image.img.height);
        const scaledWidth = image.img.width * scale;
        const scaledHeight = image.img.height * scale;
        const offsetX = (imageWidth - 24 - scaledWidth) / 2;
        const offsetY = (imageHeight - 24 - scaledHeight) / 2;
        
        ctx.drawImage(image.img, x + 12 + offsetX, y + 12 + offsetY, scaledWidth, scaledHeight);
        ctx.restore();
    });
}

// 导出图片
function exportImage() {
    if (uploadedImages.length === 0) {
        alert('请先生成拼图');
        return;
    }

    const link = document.createElement('a');
    link.download = `拼图-${layouts[currentLayoutIndex].name}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = puzzleCanvas.toDataURL('image/png', 1.0);
    
    // 添加下载动画
    exportBtn.innerHTML = `
        <svg class="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span>导出中...</span>
    `;
    
    setTimeout(() => {
        link.click();
        exportBtn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>导出图片</span>
        `;
    }, 1000);
}

// 添加加载动画样式
const style = document.createElement('style');
style.textContent = `
    .loading {
        display: inline-block;
        position: relative;
    }
    .loading::after {
        content: '';
        width: 16px;
        height: 16px;
        margin: 0 0 0 8px;
        display: inline-block;
        border: 2px solid transparent;
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .drag-over {
        background: linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 100%);
        border-color: #3b82f6;
        transform: scale(1.02);
    }
    .image-preview {
        transition: all 0.3s ease;
    }
    .image-preview:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
`;
document.head.appendChild(style);
