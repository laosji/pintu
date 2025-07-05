import React, { useState, useRef, useCallback } from 'react';
import { Upload, Grid, Shuffle, Download, X, Sparkles, Image, Zap } from 'lucide-react';

const PuzzleMaker = () => {
  const [images, setImages] = useState([]);
  const [puzzle, setPuzzle] = useState(null);
  const [currentLayout, setCurrentLayout] = useState('grid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // 布局类型定义
  const layoutTypes = [
    { id: 'grid', name: '网格布局', icon: Grid, color: 'from-blue-500 to-purple-600' },
    { id: 'main-side', name: '主图布局', icon: Image, color: 'from-green-500 to-teal-600' },
    { id: 'mosaic', name: '艺术拼贴', icon: Sparkles, color: 'from-pink-500 to-rose-600' },
    { id: 'vertical', name: '垂直叠加', icon: Grid, color: 'from-orange-500 to-yellow-600' },
    { id: 'horizontal', name: '水平展开', icon: Grid, color: 'from-indigo-500 to-blue-600' }
  ];

  // 处理文件上传
  const handleFileUpload = useCallback((event) => {
    const files = Array.from(event.target.files);
    if (files.length > 10) {
      alert('最多只能上传10张图片');
      return;
    }

    const newImages = [];
    let loadedCount = 0;

    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            newImages[index] = {
              id: Date.now() + index,
              file,
              url: e.target.result,
              img,
              width: img.width,
              height: img.height,
              aspectRatio: img.width / img.height
            };
            loadedCount++;
            if (loadedCount === files.length) {
              setImages(prev => [...prev, ...newImages.filter(Boolean)]);
            }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }, []);

  // 拖拽处理
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload({ target: { files } });
    }
  }, [handleFileUpload]);

  // 删除图片
  const removeImage = useCallback((id) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setPuzzle(null);
  }, []);

  // 计算网格布局
  const calculateGridLayout = (imageCount, canvasWidth, canvasHeight) => {
    const cols = Math.ceil(Math.sqrt(imageCount));
    const rows = Math.ceil(imageCount / cols);
    const cellWidth = canvasWidth / cols;
    const cellHeight = canvasHeight / rows;
    return { cols, rows, cellWidth, cellHeight };
  };

  // 计算主图+侧图布局
  const calculateMainSideLayout = (imageCount, canvasWidth, canvasHeight) => {
    const mainWidth = canvasWidth * 0.6;
    const sideWidth = canvasWidth * 0.4;
    const sideHeight = canvasHeight / (imageCount - 1);
    return { mainWidth, sideWidth, sideHeight };
  };

  // 生成拼图
  const generatePuzzle = useCallback(async () => {
    if (images.length === 0) {
      alert('请先上传图片');
      return;
    }

    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 设置画布尺寸
    const canvasWidth = 1200;
    const canvasHeight = 800;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    try {
      switch (currentLayout) {
        case 'grid':
          await drawGridLayout(ctx, images, canvasWidth, canvasHeight);
          break;
        case 'main-side':
          await drawMainSideLayout(ctx, images, canvasWidth, canvasHeight);
          break;
        case 'mosaic':
          await drawMosaicLayout(ctx, images, canvasWidth, canvasHeight);
          break;
        case 'vertical':
          await drawVerticalLayout(ctx, images, canvasWidth, canvasHeight);
          break;
        case 'horizontal':
          await drawHorizontalLayout(ctx, images, canvasWidth, canvasHeight);
          break;
      }

      // 生成预览图
      const dataURL = canvas.toDataURL('image/png');
      setPuzzle(dataURL);
    } catch (error) {
      console.error('生成拼图失败:', error);
      alert('生成拼图失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [images, currentLayout]);

  // 绘制网格布局
  const drawGridLayout = async (ctx, images, canvasWidth, canvasHeight) => {
    const { cols, rows, cellWidth, cellHeight } = calculateGridLayout(images.length, canvasWidth, canvasHeight);
    const padding = 8;

    for (let i = 0; i < images.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * cellWidth + padding;
      const y = row * cellHeight + padding;
      const width = cellWidth - padding * 2;
      const height = cellHeight - padding * 2;

      // 绘制圆角矩形背景
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      drawRoundedRect(ctx, x, y, width, height, 12);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // 绘制图片
      const img = images[i].img;
      const scale = Math.min(width / img.width, height / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (width - scaledWidth) / 2;
      const offsetY = (height - scaledHeight) / 2;

      ctx.save();
      drawRoundedRect(ctx, x, y, width, height, 12);
      ctx.clip();
      ctx.drawImage(img, x + offsetX, y + offsetY, scaledWidth, scaledHeight);
      ctx.restore();
    }
  };

  // 绘制主图+侧图布局
  const drawMainSideLayout = async (ctx, images, canvasWidth, canvasHeight) => {
    if (images.length === 0) return;

    const { mainWidth, sideWidth, sideHeight } = calculateMainSideLayout(images.length, canvasWidth, canvasHeight);
    const padding = 12;

    // 绘制主图
    const mainImg = images[0].img;
    const mainScale = Math.min((mainWidth - padding * 2) / mainImg.width, (canvasHeight - padding * 2) / mainImg.height);
    const mainScaledWidth = mainImg.width * mainScale;
    const mainScaledHeight = mainImg.height * mainScale;
    const mainOffsetX = (mainWidth - mainScaledWidth) / 2;
    const mainOffsetY = (canvasHeight - mainScaledHeight) / 2;

    // 主图背景
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    drawRoundedRect(ctx, padding, padding, mainWidth - padding * 2, canvasHeight - padding * 2, 16);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.save();
    drawRoundedRect(ctx, padding, padding, mainWidth - padding * 2, canvasHeight - padding * 2, 16);
    ctx.clip();
    ctx.drawImage(mainImg, mainOffsetX, mainOffsetY, mainScaledWidth, mainScaledHeight);
    ctx.restore();

    // 绘制侧图
    for (let i = 1; i < images.length; i++) {
      const y = (i - 1) * sideHeight + padding;
      const img = images[i].img;
      const scale = Math.min((sideWidth - padding * 3) / img.width, (sideHeight - padding * 2) / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (sideWidth - padding * 2 - scaledWidth) / 2;
      const offsetY = (sideHeight - padding * 2 - scaledHeight) / 2;

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      drawRoundedRect(ctx, mainWidth + padding, y, sideWidth - padding * 2, sideHeight - padding, 12);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.save();
      drawRoundedRect(ctx, mainWidth + padding, y, sideWidth - padding * 2, sideHeight - padding, 12);
      ctx.clip();
      ctx.drawImage(img, mainWidth + padding + offsetX, y + offsetY, scaledWidth, scaledHeight);
      ctx.restore();
    }
  };

  // 绘制马赛克布局
  const drawMosaicLayout = async (ctx, images, canvasWidth, canvasHeight) => {
    const positions = [];
    const minSize = 120;
    const maxSize = 280;

    for (let i = 0; i < images.length; i++) {
      let attempts = 0;
      let position;
      
      do {
        const size = minSize + Math.random() * (maxSize - minSize);
        position = {
          x: Math.random() * (canvasWidth - size - 20) + 10,
          y: Math.random() * (canvasHeight - size - 20) + 10,
          width: size,
          height: size,
          rotation: (Math.random() - 0.5) * 0.2
        };
        attempts++;
      } while (attempts < 50 && positions.some(p => 
        position.x < p.x + p.width && position.x + position.width > p.x &&
        position.y < p.y + p.height && position.y + position.height > p.y
      ));

      positions.push(position);
    }

    images.forEach((image, i) => {
      const pos = positions[i];
      const img = image.img;
      
      ctx.save();
      ctx.translate(pos.x + pos.width / 2, pos.y + pos.height / 2);
      ctx.rotate(pos.rotation);
      
      // 绘制阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      
      // 绘制白色背景
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(ctx, -pos.width / 2, -pos.height / 2, pos.width, pos.height, 16);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      
      // 绘制图片
      const scale = Math.min(pos.width / img.width, pos.height / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      ctx.save();
      drawRoundedRect(ctx, -pos.width / 2, -pos.height / 2, pos.width, pos.height, 16);
      ctx.clip();
      ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
      
      ctx.restore();
    });
  };

  // 绘制垂直布局
  const drawVerticalLayout = async (ctx, images, canvasWidth, canvasHeight) => {
    const cellHeight = canvasHeight / images.length;
    const padding = 6;

    for (let i = 0; i < images.length; i++) {
      const y = i * cellHeight + padding;
      const img = images[i].img;
      const scale = Math.min((canvasWidth - padding * 2) / img.width, (cellHeight - padding * 2) / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (canvasWidth - scaledWidth) / 2;
      const offsetY = (cellHeight - scaledHeight) / 2;

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      drawRoundedRect(ctx, padding, y, canvasWidth - padding * 2, cellHeight - padding * 2, 8);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.save();
      drawRoundedRect(ctx, padding, y, canvasWidth - padding * 2, cellHeight - padding * 2, 8);
      ctx.clip();
      ctx.drawImage(img, offsetX, y + offsetY, scaledWidth, scaledHeight);
      ctx.restore();
    }
  };

  // 绘制水平布局
  const drawHorizontalLayout = async (ctx, images, canvasWidth, canvasHeight) => {
    const cellWidth = canvasWidth / images.length;
    const padding = 6;

    for (let i = 0; i < images.length; i++) {
      const x = i * cellWidth + padding;
      const img = images[i].img;
      const scale = Math.min((cellWidth - padding * 2) / img.width, (canvasHeight - padding * 2) / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (cellWidth - scaledWidth) / 2;
      const offsetY = (canvasHeight - scaledHeight) / 2;

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      drawRoundedRect(ctx, x, padding, cellWidth - padding * 2, canvasHeight - padding * 2, 8);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.save();
      drawRoundedRect(ctx, x, padding, cellWidth - padding * 2, canvasHeight - padding * 2, 8);
      ctx.clip();
      ctx.drawImage(img, x + offsetX, offsetY, scaledWidth, scaledHeight);
      ctx.restore();
    }
  };

  // 绘制圆角矩形
  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
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
  };

  // 切换布局
  const switchLayout = useCallback(() => {
    const currentIndex = layoutTypes.findIndex(l => l.id === currentLayout);
    const nextIndex = (currentIndex + 1) % layoutTypes.length;
    setCurrentLayout(layoutTypes[nextIndex].id);
  }, [currentLayout]);

  // 导出图片
  const exportImage = useCallback(() => {
    if (!puzzle) {
      alert('请先生成拼图');
      return;
    }

    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `puzzle-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [puzzle]);

  const currentLayoutInfo = layoutTypes.find(l => l.id === currentLayout);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">
            AI 拼图工具
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            上传您的图片，让 AI 为您创造独特的艺术拼图作品
          </p>
        </div>

        {/* 上传区域 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">上传图片</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              最多 10 张图片
            </div>
          </div>
          
          <div 
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
              dragOver 
                ? 'border-blue-500 bg-blue-50/50 scale-105' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {dragOver ? '松开鼠标上传文件' : '点击或拖拽上传图片'}
              </h3>
              <p className="text-gray-600">支持 JPG、PNG、WEBP 格式</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* 图片预览 */}
          {images.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  已上传图片
                </h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {images.length} 张图片
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <img
                        src={image.url}
                        alt={`预览 ${index + 1}`}
                        className="w-full h-24 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <button
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 控制面板 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* 生成按钮 */}
            <button
              onClick={generatePuzzle}
              disabled={images.length === 0 || isGenerating}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center gap-3"
            >
              <Zap className="w-5 h-5" />
              <span>{isGenerating ? '正在生成...' : '生成拼图'}</span>
              {isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl animate-pulse"></div>
              )}
            </button>

            {/* 布局选择 */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">当前布局:</div>
              <div className={`px-4 py-2 bg-gradient-to-r ${currentLayoutInfo?.color} text-white rounded-xl font-medium flex items-center gap-2`}>
                <currentLayoutInfo.icon className="w-4 h-4" />
                {currentLayoutInfo?.name}
              </div>
            </div>

            {/* 切换布局按钮 */}
            <button
              onClick={switchLayout}
              disabled={images.length === 0}
              className="px-6 py-3 bg-white/90 border border-gray-200 text-gray-700 rounded-2xl font-medium hover:bg-white hover:shadow-lg disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              切换布局
            </button>

            {/* 导出按钮 */}
            <button
              onClick={exportImage}
              disabled={!puzzle}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-medium hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              导出图片
            </button>
          </div>
        </div>

        {/* 拼图预览 */}
        {puzzle && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">拼图预览</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                生成完成
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative group">
                <img
                  src={puzzle}
                  alt="拼图预览"
                  className="max-w-full max-h-96 object-contain rounded-2xl shadow-2xl border border-gray-200 transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              </div>
            </div>
          </div>
        )}

        {/* 隐藏的画布 */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default PuzzleMaker;