class Background3D {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // 天空蓝色
        document.getElementById('background3d').appendChild(this.renderer.domElement);
        
        this.init();
        this.animate();
        
        // 添加子弹管理
        this.bullets = [];
        this.lastShootTime = {};  // 记录每个士兵上次射击时间
        
        // 添加士兵数组
        this.soldiers = [];
        
        // 添加音频上下文
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 添加玩家状态
        this.playerHealth = 100;
        this.isPlayerInvincible = false;
        this.invincibleTime = 1000; // 受伤后的无敌时间(毫秒)
        
        // 修改射击控制
        this.shootInterval = 1000;  // 每秒发射一次
        this.lastShootTime = 0;     // 上次射击时间
        
        // 添加碰撞检测参数
        this.tankCollisionRadius = 2;    // 坦克碰撞半径
        this.soldierCollisionRadius = 1;  // 士兵碰撞半径
    }
    
    init() {
        // 添加环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // 添加平行光（模拟太阳光）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 0);
        this.scene.add(directionalLight);
        
        // 创建沙漠地面
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xD2B48C,  // 沙子颜色
            side: THREE.DoubleSide,
            shininess: 0
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        
        // 添加地面纹理变化
        const vertices = ground.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 1] = Math.random() * 0.5;
        }
        ground.geometry.attributes.position.needsUpdate = true;
        
        this.scene.add(ground);
        
        // 添加仙人掌和木箱
        this.addDecorations();
        
        // 设置相机位置
        this.camera.position.set(0, 40, 60);
        this.camera.lookAt(0, 0, 0);
    }
    
    createCactus(x, z) {
        const group = new THREE.Group();
        
        // 主干
        const trunkGeometry = new THREE.CylinderGeometry(1, 1.2, 6, 8);
        const cactusMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2F4F2F,
            shininess: 0
        });
        const trunk = new THREE.Mesh(trunkGeometry, cactusMaterial);
        group.add(trunk);
        
        // 添加分支
        const branchCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < branchCount; i++) {
            const height = 2 + Math.random() * 2;
            const branchGeometry = new THREE.CylinderGeometry(0.6, 0.8, height, 8);
            const branch = new THREE.Mesh(branchGeometry, cactusMaterial);
            
            branch.position.y = Math.random() * 2;
            branch.position.x = (Math.random() - 0.5) * 2;
            branch.rotation.z = (Math.random() - 0.5) * Math.PI / 3;
            
            group.add(branch);
        }
        
        group.position.set(x, 0, z);
        return group;
    }
    
    createWoodenBox(x, z) {
        const group = new THREE.Group();
        
        // 创建木箱
        const boxGeometry = new THREE.BoxGeometry(3, 3, 3);
        const woodMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B4513,
            shininess: 5
        });
        
        const box = new THREE.Mesh(boxGeometry, woodMaterial);
        
        // 添加边缘装饰
        const edgeGeometry = new THREE.BoxGeometry(3.2, 0.4, 0.4);
        const edgeMaterial = new THREE.MeshPhongMaterial({
            color: 0x4A3728,
            shininess: 10
        });
        
        // 添加四个边缘
        for (let i = 0; i < 4; i++) {
            const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            edge.position.y = 1.5;
            edge.rotation.y = (Math.PI / 2) * i;
            box.add(edge);
        }
        
        box.position.set(x, 1.5, z);
        box.rotation.y = Math.random() * Math.PI * 2;
        
        group.add(box);
        return group;
    }
    
    addDecorations() {
        // 添加仙人掌
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            const cactus = this.createCactus(x, z);
            this.scene.add(cactus);
        }
        
        // 添加木箱
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 160;
            const z = (Math.random() - 0.5) * 160;
            const box = this.createWoodenBox(x, z);
            this.scene.add(box);
        }
    }
    
    createSoldier(x, z) {
        const group = new THREE.Group();
        
        // 士兵身体
        const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2F4F2F,  // 军绿色
            shininess: 30
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        
        // 头部
        const headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0x2F4F2F
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2;
        group.add(head);
        
        // 武器
        const gunGeometry = new THREE.BoxGeometry(0.2, 0.2, 2);
        const gunMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a
        });
        const gun = new THREE.Mesh(gunGeometry, gunMaterial);
        gun.position.set(0.5, 1, 0.5);
        group.add(gun);
        
        group.position.set(x, 1.5, z);
        
        // 添加士兵属性
        group.userData = {
            type: 'soldier',
            health: 100,
            shootInterval: 2000,  // 射击间隔(毫秒)
            lastShootTime: 0,
            speed: 0.05,
            rotationSpeed: 0.02
        };
        
        this.soldiers.push(group);
        return group;
    }
    
    createBullet(position, direction) {
        const bulletGroup = new THREE.Group();
        
        // 增大子弹主体，让子弹更容易看到
        const bulletGeometry = new THREE.SphereGeometry(0.6, 16, 16);  // 增大子弹尺寸
        const bulletMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 3,  // 增强发光强度
            transparent: true,
            opacity: 1
        });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        // 添加更长的拖尾效果
        const trailGeometry = new THREE.CylinderGeometry(0.3, 0.1, 6, 16);  // 加长拖尾
        const trailMaterial = new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff3300,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.8
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.z = -3;  // 拖尾更长
        trail.rotation.x = Math.PI / 2;
        
        // 添加更大的发光效果
        const glowGeometry = new THREE.SphereGeometry(0.9, 16, 16);
        const glowMaterial = new THREE.MeshPhongMaterial({
            color: 0xff3300,
            emissive: 0xff0000,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.4
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        
        bulletGroup.add(bullet);
        bulletGroup.add(trail);
        bulletGroup.add(glow);
        bulletGroup.position.copy(position);
        
        // 设置子弹朝向
        const lookAt = new THREE.Vector3().addVectors(
            position,
            direction.multiplyScalar(1)
        );
        bulletGroup.lookAt(lookAt);
        
        bulletGroup.userData = {
            direction: direction.normalize(),
            speed: 0.4,  // 降低子弹速度
            damage: 10,
            lifetime: 0
        };
        
        this.bullets.push(bulletGroup);
        this.scene.add(bulletGroup);
        
        // 添加更多的发射粒子效果
        this.createShootParticles(position);
    }
    
    createShootParticles(position) {
        const particleCount = 20;  // 增加粒子数量
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.2, 8, 8);
            const material = new THREE.MeshPhongMaterial({
                color: 0xff6600,
                emissive: 0xff3300,
                emissiveIntensity: 2,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            // 增加粒子速度
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                ),
                lifetime: 30
            };
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // 粒子动画
        const animateParticles = () => {
            let allDead = true;
            
            particles.children.forEach(particle => {
                if (particle.userData.lifetime > 0) {
                    particle.position.add(particle.userData.velocity);
                    particle.userData.lifetime--;
                    particle.material.opacity = particle.userData.lifetime / 30;
                    particle.scale.multiplyScalar(0.95);
                    allDead = false;
                }
            });
            
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particles);
            }
        };
        
        animateParticles();
    }
    
    updateSoldiers(playerPosition) {
        const currentTime = Date.now();
        
        // 检查坦克和士兵的碰撞
        this.soldiers.forEach(soldier => {
            const distance = soldier.position.distanceTo(new THREE.Vector3(
                playerPosition.x,
                0,
                playerPosition.z
            ));
            
            // 如果坦克碰到士兵
            if (distance < this.tankCollisionRadius + this.soldierCollisionRadius) {
                // 播放碰撞音效
                this.playCollisionSound();
                
                // 显示碰撞特效
                this.createCollisionEffect(soldier.position);
                
                // 直接结束游戏
                this.gameOver("你撞到了敌人！");
                return;
            }
        });
        
        // 每秒随机选择一个士兵射击
        if (currentTime - this.lastShootTime > this.shootInterval && this.soldiers.length > 0) {
            // 随机选择一个士兵
            const randomIndex = Math.floor(Math.random() * this.soldiers.length);
            const shooter = this.soldiers[randomIndex];
            
            // 计算到玩家的方向
            const toPlayer = new THREE.Vector3()
                .subVectors(playerPosition, shooter.position)
                .normalize();
            
            // 检查是否面向玩家
            const facing = new THREE.Vector3(
                Math.sin(shooter.rotation.y), 
                0, 
                Math.cos(shooter.rotation.y)
            );
            const dot = facing.dot(toPlayer);
            
            if (dot > 0.9) {  // 如果基本面向玩家
                // 从枪口位置发射
                const gunTip = new THREE.Vector3(0.5, 1, 1)
                    .applyMatrix4(shooter.matrixWorld);
                
                this.createBullet(gunTip, toPlayer);
                this.playShootSound();
                this.createMuzzleFlash(gunTip);
            }
            
            this.lastShootTime = currentTime;
        }
        
        // 更新所有士兵的朝向和移动
        this.soldiers.forEach(soldier => {
            // 计算到玩家的方向
            const toPlayer = new THREE.Vector3()
                .subVectors(playerPosition, soldier.position)
                .normalize();
            
            // 逐渐转向玩家
            const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
            let currentAngle = soldier.rotation.y;
            
            // 平滑旋转
            const angleDiff = targetAngle - currentAngle;
            if (Math.abs(angleDiff) > 0.1) {
                soldier.rotation.y += Math.sign(angleDiff) * soldier.userData.rotationSpeed;
            }
            
            // 移动士兵
            const distanceToPlayer = soldier.position.distanceTo(playerPosition);
            if (distanceToPlayer > 10) {  // 保持一定距离
                soldier.position.add(toPlayer.multiplyScalar(soldier.userData.speed));
            } else if (distanceToPlayer < 8) {  // 如果太近就后退
                soldier.position.sub(toPlayer.multiplyScalar(soldier.userData.speed));
            }
        });
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bulletGroup = this.bullets[i];
            
            // 更新子弹位置
            bulletGroup.position.add(
                bulletGroup.userData.direction.clone().multiplyScalar(bulletGroup.userData.speed)
            );
            
            // 更新子弹效果
            bulletGroup.userData.lifetime += 1;
            
            // 更新拖尾效果，让拖尾摆动更慢
            const trail = bulletGroup.children[1];
            trail.scale.z = 1 + Math.sin(bulletGroup.userData.lifetime * 0.2) * 0.3;  // 减慢摆动速度
            
            // 更新发光效果，让发光效果更明显
            const glow = bulletGroup.children[2];
            glow.scale.setScalar(1 + Math.sin(bulletGroup.userData.lifetime * 0.15) * 0.3);
            glow.material.opacity = 0.6 + Math.sin(bulletGroup.userData.lifetime * 0.1) * 0.3;
            
            // 检查是否击中玩家
            if (window.gameInstance && window.gameInstance.tank) {
                const playerPos = new THREE.Vector3(
                    window.gameInstance.tank.x,
                    0,
                    window.gameInstance.tank.y
                );
                
                const distance = bulletGroup.position.distanceTo(playerPos);
                if (distance < 2 && !this.isPlayerInvincible) { // 如果子弹足够近且玩家不处于无敌状态
                    // 对玩家造成伤害
                    this.playerHealth -= bulletGroup.userData.damage;
                    
                    // 播放受伤音效
                    this.playHitSound();
                    
                    // 设置短暂无敌时间
                    this.isPlayerInvincible = true;
                    setTimeout(() => {
                        this.isPlayerInvincible = false;
                    }, this.invincibleTime);
                    
                    // 显示受伤效果
                    this.showDamageEffect();
                    
                    // 检查游戏是否结束
                    if (this.playerHealth <= 0) {
                        this.gameOver();
                    }
                    
                    // 移除子弹
                    this.scene.remove(bulletGroup);
                    this.bullets.splice(i, 1);
                    continue;
                }
            }
            
            // 增加子弹存活时间
            if (bulletGroup.userData.lifetime > 200) {  // 增加存活时间
                this.scene.remove(bulletGroup);
                this.bullets.splice(i, 1);
            }
        }
    }
    
    playShootSound() {
        // 创建更复杂的射击音效
        const audioCtx = this.audioContext;
        
        // 主音调
        const mainOsc = audioCtx.createOscillator();
        const mainGain = audioCtx.createGain();
        mainOsc.connect(mainGain);
        mainGain.connect(audioCtx.destination);
        
        mainOsc.frequency.setValueAtTime(400, audioCtx.currentTime);
        mainOsc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        mainGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        mainGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        // 添加噪音组件
        const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioCtx.createBufferSource();
        const noiseGain = audioCtx.createGain();
        noise.buffer = noiseBuffer;
        noise.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        
        noiseGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        mainOsc.start();
        mainOsc.stop(audioCtx.currentTime + 0.1);
        noise.start();
    }
    
    playHitSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 设置受伤音效
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.type = 'sawtooth';
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    showDamageEffect() {
        // 创建红色闪屏效果
        const flashScreen = document.createElement('div');
        flashScreen.style.position = 'fixed';
        flashScreen.style.top = '0';
        flashScreen.style.left = '0';
        flashScreen.style.width = '100%';
        flashScreen.style.height = '100%';
        flashScreen.style.backgroundColor = 'rgba(255,0,0,0.3)';
        flashScreen.style.pointerEvents = 'none';
        flashScreen.style.animation = 'flash 0.5s';
        
        // 添加闪屏动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flash {
                0% { opacity: 0.6; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(flashScreen);
        
        // 移除闪屏效果
        setTimeout(() => {
            document.body.removeChild(flashScreen);
            document.head.removeChild(style);
        }, 500);
    }
    
    gameOver(message = "游戏结束") {
        // 显示游戏结束界面
        const gameOverDiv = document.createElement('div');
        gameOverDiv.style.position = 'fixed';
        gameOverDiv.style.top = '50%';
        gameOverDiv.style.left = '50%';
        gameOverDiv.style.transform = 'translate(-50%, -50%)';
        gameOverDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
        gameOverDiv.style.color = 'white';
        gameOverDiv.style.padding = '20px';
        gameOverDiv.style.borderRadius = '10px';
        gameOverDiv.style.textAlign = 'center';
        gameOverDiv.innerHTML = `
            <h2>游戏结束</h2>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                padding: 10px 20px;
                margin-top: 10px;
                background: #4CAF50;
                border: none;
                color: white;
                border-radius: 5px;
                cursor: pointer;
            ">重新开始</button>
        `;
        
        document.body.appendChild(gameOverDiv);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // 更新子弹
        this.updateBullets();
        
        // 更新士兵 (需要从游戏主循环传入玩家位置)
        if (window.gameInstance && window.gameInstance.tank) {
            const playerPosition = new THREE.Vector3(
                window.gameInstance.tank.x,
                0,
                window.gameInstance.tank.y
            );
            this.updateSoldiers(playerPosition);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    createMuzzleFlash(position) {
        // 创建枪口火焰特效
        const flashGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const flashMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffaa00,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.8
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // 动画效果
        let scale = 1;
        const animate = () => {
            scale *= 0.8;
            flash.scale.set(scale, scale, scale);
            flash.material.opacity = scale;
            
            if (scale > 0.1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(flash);
            }
        };
        
        animate();
    }
    
    createCollisionEffect(position) {
        // 创建爆炸粒子效果
        const particleCount = 30;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.3, 8, 8);
            const material = new THREE.MeshPhongMaterial({
                color: 0xff4400,
                emissive: 0xff2200,
                emissiveIntensity: 2,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            // 随机速度和方向
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.2 + Math.random() * 0.3;
            particle.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    0.3 + Math.random() * 0.3,  // 向上的速度
                    Math.sin(angle) * speed
                ),
                lifetime: 40
            };
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // 粒子动画
        const animateParticles = () => {
            let allDead = true;
            
            particles.children.forEach(particle => {
                if (particle.userData.lifetime > 0) {
                    // 添加重力效果
                    particle.userData.velocity.y -= 0.01;
                    
                    particle.position.add(particle.userData.velocity);
                    particle.userData.lifetime--;
                    particle.material.opacity = particle.userData.lifetime / 40;
                    particle.scale.multiplyScalar(0.97);
                    allDead = false;
                }
            });
            
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particles);
            }
        };
        
        animateParticles();
    }
    
    playCollisionSound() {
        const audioCtx = this.audioContext;
        
        // 创建爆炸音效
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // 设置频率包络
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        
        // 设置音量包络
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        
        oscillator.type = 'sawtooth';
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
        
        // 添加噪音组件
        const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.5, audioCtx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioCtx.createBufferSource();
        const noiseGain = audioCtx.createGain();
        noise.buffer = noiseBuffer;
        noise.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        
        noiseGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        noise.start();
    }
}

// 创建3D背景实例
const background = new Background3D();

// 处理窗口大小变化
window.addEventListener('resize', () => {
    background.camera.aspect = window.innerWidth / window.innerHeight;
    background.camera.updateProjectionMatrix();
    background.renderer.setSize(window.innerWidth, window.innerHeight);
});