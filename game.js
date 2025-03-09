class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布大小
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // 游戏状态
        this.score = 0;
        this.isGameOver = false;
        
        // 玩家坦克
        this.tank = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            angle: 0,
            speed: 3,
            rotationSpeed: 0.05,
            health: 100,  // 添加生命值属性
            maxHealth: 100  // 添加最大生命值属性
        };
        
        // 子弹数组
        this.bullets = [];
        
        // 敌人子弹数组
        this.enemyBullets = [];
        
        // 敌人攻击计时器
        this.lastEnemyAttackTime = 0;
        
        // 障碍物数组
        this.obstacles = [];
        this.createObstacles();
        
        // 控制状态
        this.keys = {};
        
        // 初始化控制
        this.initControls();
        
        // 添加背景元素
        this.createBackground();
        
        // 初始化音频系统
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建音效生成器
        this.createSoundGenerators();
        
        // 添加关卡设置
        this.level = 1;
        this.maxLevel = 5;
        this.enemyTypes = {
            soldier: {
                color: '#355E3B',
                speed: 0.5,
                points: 10,
                health: 1,
                size: 40
            },
            elite: {
                color: '#8B0000',
                speed: 0.7,
                points: 20,
                health: 2,
                size: 45
            },
            commander: {
                color: '#4B0082',
                speed: 0.4,
                points: 50,
                health: 3,
                size: 50
            }
        };
        
        // 开始第一关
        this.startLevel(this.level);
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    createObstacles() {
        for (let i = 0; i < 10; i++) {
            this.obstacles.push({
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: Math.random() * (this.canvas.height - 200) + 20,
                width: 40,
                height: 40,
                // 添加移动相关属性
                speed: 0.5 + Math.random() * 0.5,
                direction: Math.random() * Math.PI * 2,
                moveTimer: 0,
                moveInterval: 100 + Math.random() * 200
            });
        }
    }
    
    initControls() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.fire();
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        // 触摸控制
        document.getElementById('moveForward').addEventListener('touchstart', () => this.keys['ArrowUp'] = true);
        document.getElementById('moveForward').addEventListener('touchend', () => this.keys['ArrowUp'] = false);
        document.getElementById('moveBackward').addEventListener('touchstart', () => this.keys['ArrowDown'] = true);
        document.getElementById('moveBackward').addEventListener('touchend', () => this.keys['ArrowDown'] = false);
        document.getElementById('turnLeft').addEventListener('touchstart', () => this.keys['ArrowLeft'] = true);
        document.getElementById('turnLeft').addEventListener('touchend', () => this.keys['ArrowLeft'] = false);
        document.getElementById('turnRight').addEventListener('touchstart', () => this.keys['ArrowRight'] = true);
        document.getElementById('turnRight').addEventListener('touchend', () => this.keys['ArrowRight'] = false);
        document.getElementById('fire').addEventListener('touchstart', () => this.fire());
    }
    
    createSoundGenerators() {
        // 射击音效生成器
        this.createShootSound = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 设置音量包络
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            // 设置频率包络
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
            
            oscillator.type = 'square';
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
        
        // 爆炸音效生成器
        this.createExplosionSound = () => {
            const noise = this.audioContext.createBufferSource();
            const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.5, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // 生成白噪声
            for (let i = 0; i < buffer.length; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            noise.buffer = buffer;
            
            // 设置滤波器
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            filter.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.5);
            
            // 设置音量包络
            gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            noise.start();
            noise.stop(this.audioContext.currentTime + 0.5);
        };
        
        // 坦克移动音效生成器
        this.createTankMoveSound = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 设置低频震荡
            oscillator.frequency.setValueAtTime(50, this.audioContext.currentTime);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            
            return { oscillator, gainNode };
        };

        // 添加击中音效生成器
        this.createHitSound = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 设置音量包络
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            // 设置频率包络
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
            
            oscillator.type = 'triangle';
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }
    
    fire() {
        // 播放射击音效
        this.createShootSound();
        
        // 延迟播放装填音效
        setTimeout(() => {
            const reloadOsc = this.audioContext.createOscillator();
            const reloadGain = this.audioContext.createGain();
            
            reloadOsc.connect(reloadGain);
            reloadGain.connect(this.audioContext.destination);
            
            reloadOsc.frequency.setValueAtTime(400, this.audioContext.currentTime);
            reloadOsc.frequency.linearRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
            
            reloadGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            reloadGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
            
            reloadOsc.start();
            reloadOsc.stop(this.audioContext.currentTime + 0.1);
        }, 300);
        
        const bullet = {
            x: this.tank.x + Math.cos(this.tank.angle) * 30,
            y: this.tank.y + Math.sin(this.tank.angle) * 30,
            angle: this.tank.angle,
            speed: 7
        };
        this.bullets.push(bullet);
    }
    
    update() {
        // 处理坦克移动音效
        if (this.keys['ArrowUp'] || this.keys['ArrowDown']) {
            if (!this.tankMoveSound) {
                const sound = this.createTankMoveSound();
                this.tankMoveSound = sound;
                sound.oscillator.start();
            }
        } else if (this.tankMoveSound) {
            this.tankMoveSound.oscillator.stop();
            this.tankMoveSound = null;
        }
        
        // 更新坦克位置
        if (this.keys['ArrowUp']) {
            this.tank.x += Math.cos(this.tank.angle) * this.tank.speed;
            this.tank.y += Math.sin(this.tank.angle) * this.tank.speed;
        }
        if (this.keys['ArrowDown']) {
            this.tank.x -= Math.cos(this.tank.angle) * this.tank.speed;
            this.tank.y -= Math.sin(this.tank.angle) * this.tank.speed;
        }
        if (this.keys['ArrowLeft']) {
            this.tank.angle -= this.tank.rotationSpeed;
        }
        if (this.keys['ArrowRight']) {
            this.tank.angle += this.tank.rotationSpeed;
        }
        
        // 限制坦克在画布内
        this.tank.x = Math.max(20, Math.min(this.canvas.width - 20, this.tank.x));
        this.tank.y = Math.max(20, Math.min(this.canvas.height - 20, this.tank.y));
        
        // 更新子弹位置
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;
            
            // 检查子弹是否击中敌人
            for (let j = this.obstacles.length - 1; j >= 0; j--) {
                const enemy = this.obstacles[j];
                if (this.checkCollision(bullet, enemy)) {
                    // 移除子弹
                    this.bullets.splice(i, 1);
                    
                    // 减少敌人生命值
                    enemy.health--;
                    
                    // 播放击中音效
                    this.createHitSound();
                    
                    // 如果敌人生命值为0，移除敌人
                    if (enemy.health <= 0) {
                        this.obstacles.splice(j, 1);
                        this.score += this.enemyTypes[enemy.type].points;
                        
                        // 如果所有敌人都被消灭，进入下一关
                        if (this.obstacles.length === 0) {
                            if (this.level < this.maxLevel) {
                                this.level++;
                                this.startLevel(this.level);
                            } else {
                                alert('恭喜你通关了！');
                                this.isGameOver = true;
                            }
                        }
                    }
                    break;
                }
            }
            
            // 移除超出画布的子弹
            if (bullet.x < 0 || bullet.x > this.canvas.width || 
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.bullets.splice(i, 1);
            }
        }
        
        // 敌人攻击逻辑
        const now = Date.now();
        if (now - this.lastEnemyAttackTime > 2000) { // 每2秒攻击一次
            // 随机选择一个敌人进行攻击
            if (this.obstacles.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.obstacles.length);
                const enemy = this.obstacles[randomIndex];
                
                // 计算敌人到玩家的角度
                const dx = this.tank.x - enemy.x;
                const dy = this.tank.y - enemy.y;
                const angle = Math.atan2(dy, dx);
                
                // 创建敌人子弹
                this.enemyBullets.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height / 2,
                    angle: angle,
                    speed: 3,
                    damage: 10
                });
                
                // 更新攻击时间
                this.lastEnemyAttackTime = now;
            }
        }
        
        // 更新敌人子弹位置
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;
            
            // 检查子弹是否击中玩家坦克
            const dx = bullet.x - this.tank.x;
            const dy = bullet.y - this.tank.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) { // 坦克半径约为20
                // 移除子弹
                this.enemyBullets.splice(i, 1);
                
                // 减少玩家生命值
                this.tank.health -= bullet.damage;
                
                // 播放击中音效
                this.createHitSound();
                
                // 如果玩家生命值为0，游戏结束
                if (this.tank.health <= 0) {
                    this.tank.health = 0;
                    alert('游戏结束！');
                    this.isGameOver = true;
                }
                
                continue;
            }
            
            // 移除超出画布的子弹
            if (bullet.x < 0 || bullet.x > this.canvas.width || 
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }
    
    checkCollision(bullet, obstacle) {
        return bullet.x > obstacle.x && 
               bullet.x < obstacle.x + obstacle.width &&
               bullet.y > obstacle.y && 
               bullet.y < obstacle.y + obstacle.height;
    }
    
    createBackground() {
        // 创建草原背景图案
        this.prairiePattern = this.createPrairiePattern();
        
        // 创建装饰元素（树木、石头等）
        this.decorations = [];
        for (let i = 0; i < 30; i++) {
            this.decorations.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                type: Math.random() < 0.6 ? 'tree' : 'rock',
                size: Math.random() * 30 + 20,
                rotation: Math.random() * Math.PI * 2
            });
        }
    }

    createPrairiePattern() {
        const patternCanvas = document.createElement('canvas');
        const patternContext = patternCanvas.getContext('2d');
        patternCanvas.width = 200;
        patternCanvas.height = 200;

        // 基础草原颜色
        patternContext.fillStyle = '#90EE90';  // 浅绿色
        patternContext.fillRect(0, 0, 200, 200);
        
        // 添加草地纹理
        for (let i = 0; i < 200; i += 10) {
            for (let j = 0; j < 200; j += 10) {
                patternContext.fillStyle = `rgba(34,139,34,${Math.random() * 0.2})`;  // 深绿色点缀
                patternContext.fillRect(i + Math.random() * 10, j + Math.random() * 10, 2, 8);
            }
        }
        
        // 添加草叶效果
        for (let i = 0; i < 500; i++) {
            patternContext.strokeStyle = `rgba(144,238,144,${Math.random() * 0.3})`;  // 浅绿色草叶
            patternContext.beginPath();
            const x = Math.random() * 200;
            const y = Math.random() * 200;
            patternContext.moveTo(x, y);
            patternContext.lineTo(x + (Math.random() - 0.5) * 10, y - Math.random() * 15);
            patternContext.stroke();
        }

        // 添加野花点缀
        for (let i = 0; i < 50; i++) {
            patternContext.fillStyle = `rgba(255,255,0,${Math.random() * 0.2})`;  // 黄色野花
            const x = Math.random() * 200;
            const y = Math.random() * 200;
            patternContext.beginPath();
            patternContext.arc(x, y, 2, 0, Math.PI * 2);
            patternContext.fill();
        }

        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制装饰元素
        this.drawDecorations();
        
        // 绘制障碍物
        this.ctx.fillStyle = '#4A4A4A';  // 更改障碍物颜色为深灰色
        this.obstacles.forEach(obstacle => {
            // 绘制障碍物主体
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // 添加阴影效果
            this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
            this.ctx.fillRect(obstacle.x + 2, obstacle.y + 2, obstacle.width, obstacle.height);
            
            // 添加高光效果
            this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width/2, obstacle.height/2);
        });
        
        // 绘制玩家坦克生命值
        this.drawPlayerHealthBar();
        
        // 绘制士兵
        this.obstacles.forEach(enemy => {
            // 敌人阴影
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(enemy.x + enemy.width/2, enemy.y + enemy.height + 5, 
                           enemy.width/2, enemy.height/8, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 根据敌人类型绘制不同外观
            switch(enemy.type) {
                case 'commander':
                    this.drawCommander(enemy);
                    break;
                case 'elite':
                    this.drawElite(enemy);
                    break;
                default:
                    this.drawSoldier(enemy);
            }
            
            // 显示生命值
            if (enemy.health > 1) {
                this.drawHealthBar(enemy);
            }
        });
        
        // 绘制坦克
        this.ctx.save();
        this.ctx.translate(this.tank.x, this.tank.y);
        this.ctx.rotate(this.tank.angle);
        drawTank(this.ctx, 0, 0, 0);
        this.ctx.restore();
        
        // 绘制玩家子弹
        this.bullets.forEach(bullet => {
            this.drawBullet(bullet);
        });
        
        // 绘制敌人子弹
        this.enemyBullets.forEach(bullet => {
            // 使用红色绘制敌人子弹
            this.ctx.fillStyle = '#FF0000';
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 显示分数
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`分数: ${this.score}`, 20, this.canvas.height - 20);
    }

    drawBackground() {
        // 绘制草原背景
        this.ctx.fillStyle = this.prairiePattern;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 添加自然光效果
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(135,206,235,0.1)');  // 天蓝色
        gradient.addColorStop(0.5, 'rgba(144,238,144,0.05)');  // 浅绿色
        gradient.addColorStop(1, 'rgba(34,139,34,0.15)');  // 森林绿
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawDecorations() {
        this.decorations.forEach(dec => {
            if (dec.type === 'tree') {
                // 绘制树木
                this.ctx.save();
                this.ctx.translate(dec.x + dec.size/2, dec.y + dec.size);
                
                // 树干
                this.ctx.fillStyle = '#8B4513';  // 棕色
                this.ctx.fillRect(-dec.size/6, -dec.size, dec.size/3, dec.size);
                
                // 树冠
                this.ctx.fillStyle = '#228B22';  // 森林绿
                this.ctx.beginPath();
                this.ctx.arc(0, -dec.size, dec.size/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            } else {
                // 绘制石头
                this.ctx.save();
                this.ctx.translate(dec.x + dec.size/2, dec.y + dec.size/2);
                this.ctx.rotate(dec.rotation);
                
                this.ctx.fillStyle = '#808080';  // 灰色
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, dec.size/2, dec.size/3, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 添加石头纹理
                this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                for (let i = 0; i < 3; i++) {
                    this.ctx.beginPath();
                    this.ctx.ellipse(
                        (Math.random() - 0.5) * dec.size/3,
                        (Math.random() - 0.5) * dec.size/4,
                        dec.size/6,
                        dec.size/8,
                        Math.random() * Math.PI,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.stroke();
                }
                
                this.ctx.restore();
            }
        });
    }
    
    gameLoop() {
        if (!this.isGameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    startLevel(level) {
        this.level = level;
        this.obstacles = [];
        
        // 根据关卡设置敌人数量和类型
        const enemyCount = {
            soldier: 5 + Math.floor(level * 1.5),
            elite: Math.floor(level * 0.8),
            commander: Math.floor(level * 0.3)
        };
        
        // 生成不同类型的敌人
        Object.keys(enemyCount).forEach(type => {
            for (let i = 0; i < enemyCount[type]; i++) {
                this.createEnemy(type);
            }
        });
        
        // 显示关卡信息
        this.showLevelInfo();
    }
    
    createEnemy(type) {
        const enemyData = this.enemyTypes[type];
        const size = type === 'commander' ? 50 : type === 'elite' ? 45 : 40;
        
        this.obstacles.push({
            x: Math.random() * (this.canvas.width - size - 60) + 30,
            y: Math.random() * (this.canvas.height - size - 200) + 30,
            width: size,
            height: size,
            type: type,
            health: enemyData.health,
            speed: enemyData.speed + Math.random() * 0.3,
            direction: Math.random() * Math.PI * 2,
            moveTimer: 0,
            moveInterval: 100 + Math.random() * 200,
            points: enemyData.points
        });
    }
    
    showLevelInfo() {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'level-info';
        levelDiv.innerHTML = `
            <h2>第 ${this.level} 关</h2>
            <p>消灭所有敌人！</p>
        `;
        document.body.appendChild(levelDiv);
        
        // 3秒后移除关卡信息
        setTimeout(() => {
            levelDiv.remove();
        }, 3000);
    }

    drawHealthBar(enemy) {
        const barWidth = enemy.width;
        const barHeight = 4;
        const healthPercent = enemy.health / this.enemyTypes[enemy.type].health;
        
        // 血条背景
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(enemy.x, enemy.y - 10, barWidth, barHeight);
        
        // 当前血量
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(enemy.x, enemy.y - 10, barWidth * healthPercent, barHeight);
    }

    drawSoldier(enemy) {
        // 阴影效果
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(enemy.x + 20, enemy.y + 55, 15, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 腿部 - 添加更自然的运动
        const legOffset = Math.sin(enemy.moveTimer * 0.1) * 3;
        const legGradient = this.ctx.createLinearGradient(
            enemy.x + 13, enemy.y + 40,
            enemy.x + 19, enemy.y + 52
        );
        legGradient.addColorStop(0, '#2F4F2F');
        legGradient.addColorStop(1, '#1B3B1B');
        this.ctx.fillStyle = legGradient;
        
        // 左腿
        this.ctx.fillRect(enemy.x + 13, enemy.y + 40, 6, 12 + legOffset);
        // 右腿
        this.ctx.fillRect(enemy.x + 21, enemy.y + 40, 6, 12 - legOffset);
        
        // 靴子
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(enemy.x + 12, enemy.y + 50 + legOffset, 8, 4);
        this.ctx.fillRect(enemy.x + 20, enemy.y + 50 - legOffset, 8, 4);

        // 身体 - 改进制服细节
        const bodyGradient = this.ctx.createLinearGradient(
            enemy.x + 10, enemy.y + 15,
            enemy.x + 30, enemy.y + 40
        );
        bodyGradient.addColorStop(0, '#3A5F3A');
        bodyGradient.addColorStop(0.5, '#2F4F2F');
        bodyGradient.addColorStop(1, '#1B3B1B');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(enemy.x + 10, enemy.y + 15, 20, 25);

        // 制服细节
        this.ctx.strokeStyle = '#4A7F4A';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x + 20, enemy.y + 15);
        this.ctx.lineTo(enemy.x + 20, enemy.y + 40);
        this.ctx.stroke();

        // 武器 - 更详细的步枪
        this.ctx.fillStyle = '#2A2A2A';
        this.ctx.fillRect(enemy.x + 5, enemy.y + 22, 30, 3);
        // 枪托
        this.ctx.fillStyle = '#4A3728';
        this.ctx.fillRect(enemy.x + 2, enemy.y + 21, 5, 5);
        // 瞄准镜
        this.ctx.fillStyle = '#1A1A1A';
        this.ctx.fillRect(enemy.x + 20, enemy.y + 20, 4, 2);

        // 头部 - 添加面部特征
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + 20, enemy.y + 10, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // 头盔 - 更多细节
        const helmetGradient = this.ctx.createLinearGradient(
            enemy.x + 20, enemy.y,
            enemy.x + 20, enemy.y + 16
        );
        helmetGradient.addColorStop(0, '#4A5D23');
        helmetGradient.addColorStop(1, '#3A4D13');
        this.ctx.fillStyle = helmetGradient;
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + 20, enemy.y + 8, 9, Math.PI, Math.PI * 2);
        this.ctx.fill();

        // 头盔带
        this.ctx.strokeStyle = '#2A2A2A';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x + 11, enemy.y + 8);
        this.ctx.lineTo(enemy.x + 29, enemy.y + 8);
        this.ctx.stroke();
    }

    drawElite(enemy) {
        // 阴影
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(enemy.x + 22, enemy.y + 62, 18, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 腿部 - 更重型的装备
        const legOffset = Math.sin(enemy.moveTimer * 0.1) * 2;
        const legGradient = this.ctx.createLinearGradient(
            enemy.x + 13, enemy.y + 45,
            enemy.x + 21, enemy.y + 60
        );
        legGradient.addColorStop(0, '#8B0000');
        legGradient.addColorStop(1, '#660000');
        this.ctx.fillStyle = legGradient;
        
        // 装甲腿部
        this.ctx.fillRect(enemy.x + 13, enemy.y + 45, 8, 15 + legOffset);
        this.ctx.fillRect(enemy.x + 24, enemy.y + 45, 8, 15 - legOffset);
        
        // 靴子
        this.ctx.fillStyle = '#2A2A2A';
        this.ctx.fillRect(enemy.x + 12, enemy.y + 58 + legOffset, 10, 5);
        this.ctx.fillRect(enemy.x + 23, enemy.y + 58 - legOffset, 10, 5);

        // 身体 - 重型装甲
        const bodyGradient = this.ctx.createLinearGradient(
            enemy.x + 10, enemy.y + 15,
            enemy.x + 35, enemy.y + 45
        );
        bodyGradient.addColorStop(0, '#A00000');
        bodyGradient.addColorStop(0.5, '#8B0000');
        bodyGradient.addColorStop(1, '#660000');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(enemy.x + 10, enemy.y + 15, 25, 30);

        // 装甲板细节
        this.ctx.fillStyle = '#4A0000';
        this.ctx.fillRect(enemy.x + 8, enemy.y + 20, 29, 4);
        this.ctx.fillRect(enemy.x + 8, enemy.y + 35, 29, 4);

        // 高级武器
        this.ctx.fillStyle = '#1A1A1A';
        this.ctx.fillRect(enemy.x, enemy.y + 25, 45, 6);
        // 枪管
        this.ctx.fillStyle = '#2A2A2A';
        this.ctx.fillRect(enemy.x + 42, enemy.y + 23, 8, 10);
        // 瞄准器
        this.ctx.fillStyle = '#4A4A4A';
        this.ctx.fillRect(enemy.x + 30, enemy.y + 22, 6, 4);

        // 头部
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + 22, enemy.y + 12, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // 特殊头盔
        const helmetGradient = this.ctx.createLinearGradient(
            enemy.x + 22, enemy.y,
            enemy.x + 22, enemy.y + 20
        );
        helmetGradient.addColorStop(0, '#A00000');
        helmetGradient.addColorStop(1, '#800000');
        this.ctx.fillStyle = helmetGradient;
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + 22, enemy.y + 10, 11, Math.PI, Math.PI * 2);
        this.ctx.fill();

        // 头盔装饰
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x + 22, enemy.y);
        this.ctx.lineTo(enemy.x + 28, enemy.y + 8);
        this.ctx.lineTo(enemy.x + 16, enemy.y + 8);
        this.ctx.closePath();
        this.ctx.fill();

        // 护目镜
        this.ctx.fillStyle = '#2A2A2A';
        this.ctx.fillRect(enemy.x + 17, enemy.y + 8, 10, 4);
    }

    drawCommander(enemy) {
        // 阴影
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(enemy.x + 25, enemy.y + 67, 20, 7, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 披风
        this.ctx.fillStyle = '#800080';
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x + 25, enemy.y + 20);
        this.ctx.quadraticCurveTo(
            enemy.x + 45, enemy.y + 30,
            enemy.x + 45, enemy.y + 50
        );
        this.ctx.lineTo(enemy.x + 25, enemy.y + 50);
        this.ctx.fill();

        // 腿部
        const legOffset = Math.sin(enemy.moveTimer * 0.1) * 2;
        const legGradient = this.ctx.createLinearGradient(
            enemy.x + 15, enemy.y + 50,
            enemy.x + 23, enemy.y + 65
        );
        legGradient.addColorStop(0, '#4B0082');
        legGradient.addColorStop(1, '#2A004C');
        this.ctx.fillStyle = legGradient;
        
        // 装甲腿部
        this.ctx.fillRect(enemy.x + 15, enemy.y + 50, 8, 15 + legOffset);
        this.ctx.fillRect(enemy.x + 27, enemy.y + 50, 8, 15 - legOffset);

        // 靴子
        this.ctx.fillStyle = '#1A1A1A';
        this.ctx.fillRect(enemy.x + 14, enemy.y + 63 + legOffset, 10, 5);
        this.ctx.fillRect(enemy.x + 26, enemy.y + 63 - legOffset, 10, 5);

        // 身体
        const bodyGradient = this.ctx.createLinearGradient(
            enemy.x + 10, enemy.y + 15,
            enemy.x + 35, enemy.y + 45
        );
        bodyGradient.addColorStop(0, '#6B238E');
        bodyGradient.addColorStop(0.5, '#4B0082');
        bodyGradient.addColorStop(1, '#2A004C');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(enemy.x + 10, enemy.y + 15, 30, 35);

        // 勋章和装饰
        this.ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(enemy.x + 15 + i * 8, enemy.y + 20, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 特殊武器
        this.ctx.fillStyle = '#4A4A4A';
        this.ctx.fillRect(enemy.x, enemy.y + 30, 50, 8);
        // 武器装饰
        const weaponGradient = this.ctx.createLinearGradient(
            enemy.x + 45, enemy.y + 28,
            enemy.x + 55, enemy.y + 40
        );
        weaponGradient.addColorStop(0, '#FFD700');
        weaponGradient.addColorStop(1, '#DAA520');
        this.ctx.fillStyle = weaponGradient;
        this.ctx.fillRect(enemy.x + 45, enemy.y + 28, 10, 12);

        // 头部
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + 25, enemy.y + 12, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // 指挥官帽
        this.ctx.fillStyle = '#4B0082';
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x + 10, enemy.y + 10);
        this.ctx.lineTo(enemy.x + 40, enemy.y + 10);
        this.ctx.lineTo(enemy.x + 25, enemy.y - 5);
        this.ctx.closePath();
        this.ctx.fill();

        // 帽子装饰
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + 25, enemy.y + 8, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 肩章
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(enemy.x + 8, enemy.y + 15, 8, 4);
        this.ctx.fillRect(enemy.x + 34, enemy.y + 15, 8, 4);
    }

    drawBullet(bullet) {
        // 子弹主体
        this.ctx.fillStyle = '#FF0000';  // 恢复为红色
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawObstacle(obstacle) {
        this.ctx.fillStyle = '#4A4A4A';  // 恢复为深灰色
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    // 添加绘制玩家坦克生命值的方法
    drawPlayerHealthBar() {
        // 在屏幕顶部绘制生命值条
        const barWidth = 200;
        const barHeight = 20;
        const healthPercent = this.tank.health / this.tank.maxHealth;
        const barX = 20;
        const barY = 20;
        
        // 绘制半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 25);
        
        // 绘制生命值文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`生命值: ${this.tank.health}/${this.tank.maxHealth}`, barX, barY + barHeight + 15);
        
        // 绘制生命值条边框
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // 绘制生命值条背景
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 绘制当前生命值
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // 在屏幕右下角绘制圆形生命值指示器
        const radius = 30;
        const centerX = this.canvas.width - radius - 20;
        const centerY = this.canvas.height - radius - 20;
        
        // 绘制圆形背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制边框
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 绘制生命值扇形
        this.ctx.fillStyle = '#00FF00';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.arc(centerX, centerY, radius - 2, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * healthPercent));
        this.ctx.closePath();
        this.ctx.fill();
        
        // 绘制生命值文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${this.tank.health}`, centerX, centerY);
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'alphabetic';
    }
}

// 创建游戏实例
window.onload = () => {
    const game = new Game();
};

// 修改障碍物的外观为敌方坦克
function drawObstacle(x, y) {
    ctx.fillStyle = '#8B0000'; // 深红色作为敌方坦克的颜色
    ctx.beginPath();
    
    // 坦克主体
    ctx.fillRect(x, y, 30, 30);
    
    // 坦克炮塔
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x + 10, y - 5, 10, 15);
    
    // 坦克履带
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 2, y, 4, 30);
    ctx.fillRect(x + 28, y, 4, 30);
}

// 修改玩家坦克的外观使其更醒目
function drawTank(ctx, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // 坦克主体
    ctx.fillStyle = '#006400';  // 恢复为深绿色
    ctx.fillRect(-20, -15, 40, 30);
    
    // 炮塔
    ctx.fillStyle = '#32CD32';  // 恢复为亮绿色
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // 炮管
    ctx.fillStyle = '#006400';  // 恢复为深绿色
    ctx.fillRect(0, -3, 30, 6);
    
    ctx.restore();
} 