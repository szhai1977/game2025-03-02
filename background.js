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
        const ambientLight = new THREE.AmbientLight(0x88aa88, 0.4); // 偏绿色的环境光
        this.scene.add(ambientLight);
        
        // 添加平行光（模拟太阳光）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 0);
        this.scene.add(directionalLight);
        
        // 创建绿色地面
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x90EE90,  // 浅绿色
            side: THREE.DoubleSide,
            shininess: 0
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        
        // 添加地面纹理变化
        const vertices = ground.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 1] = Math.random() * 0.2; // 减小地形起伏，模拟草原平坦特性
        }
        ground.geometry.attributes.position.needsUpdate = true;
        
        this.scene.add(ground);
        
        // 添加树木和石头
        this.addPrairieDecorations();
        
        // 设置相机位置
        this.camera.position.set(0, 40, 60);
        this.camera.lookAt(0, 0, 0);
        
        // 设置天空颜色
        this.renderer.setClearColor(0x87CEEB); // 保持天蓝色
    }
    
    createTree(x, z) {
        const group = new THREE.Group();
        
        // 树干
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 8, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513,  // 棕色
            shininess: 0
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        group.add(trunk);
        
        // 树冠
        const crownGeometry = new THREE.SphereGeometry(3, 8, 8);
        const crownMaterial = new THREE.MeshPhongMaterial({
            color: 0x228B22,  // 森林绿
            shininess: 0
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 5;
        group.add(crown);
        
        group.position.set(x, 0, z);
        return group;
    }
    
    addPrairieDecorations() {
        // 添加树木
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            const tree = this.createTree(x, z);
            this.scene.add(tree);
        }
        
        // 添加石头
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 160;
            const z = (Math.random() - 0.5) * 160;
            const box = this.createWoodenBox(x, z);
            this.scene.add(box);
        }
    }
    
    createSoldier(x, z) {
        const group = new THREE.Group();
        
        // 士兵身体 - 使用更复杂的几何体
        const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 12);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2F4F2F,  // 军绿色
            shininess: 30,
            specular: 0x1a1a1a
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        
        // 添加背包
        const backpackGeometry = new THREE.BoxGeometry(0.8, 1, 0.4);
        const backpackMaterial = new THREE.MeshPhongMaterial({
            color: 0x3A5F3A,
            shininess: 20
        });
        const backpack = new THREE.Mesh(backpackGeometry, backpackMaterial);
        backpack.position.set(0, 0.5, -0.6);
        group.add(backpack);
        
        // 添加腰带
        const beltGeometry = new THREE.TorusGeometry(0.85, 0.08, 8, 16);
        const beltMaterial = new THREE.MeshPhongMaterial({
            color: 0x4A3728,
            shininess: 30
        });
        const belt = new THREE.Mesh(beltGeometry, beltMaterial);
        belt.position.y = 0;
        belt.rotation.x = Math.PI / 2;
        group.add(belt);
        
        // 添加弹药包
        const ammoPackGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.2);
        const ammoPackMaterial = new THREE.MeshPhongMaterial({
            color: 0x2A2A2A,
            shininess: 20
        });
        const ammoPack = new THREE.Mesh(ammoPackGeometry, ammoPackMaterial);
        ammoPack.position.set(0.6, 0, 0.5);
        group.add(ammoPack);
        
        // 制服上衣
        const uniformTopGeometry = new THREE.CylinderGeometry(0.85, 0.8, 1.5, 12);
        const uniformTopMaterial = new THREE.MeshPhongMaterial({
            color: 0x3A5F3A,
            shininess: 20
        });
        const uniformTop = new THREE.Mesh(uniformTopGeometry, uniformTopMaterial);
        uniformTop.position.y = 0.75;
        group.add(uniformTop);
        
        // 制服下装
        const uniformBottomGeometry = new THREE.CylinderGeometry(0.8, 0.6, 1.5, 12);
        const uniformBottomMaterial = new THREE.MeshPhongMaterial({
            color: 0x2F4F2F,
            shininess: 20
        });
        const uniformBottom = new THREE.Mesh(uniformBottomGeometry, uniformBottomMaterial);
        uniformBottom.position.y = -0.75;
        group.add(uniformBottom);
        
        // 头部 - 使用更多细节
        const headGeometry = new THREE.SphereGeometry(0.5, 12, 12);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0xD2B48C,  // 肤色
            shininess: 10
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2;
        group.add(head);
        
        // 添加头盔
        const helmetGeometry = new THREE.SphereGeometry(0.55, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const helmetMaterial = new THREE.MeshPhongMaterial({
            color: 0x4A5D23,
            shininess: 40
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 2.2;
        group.add(helmet);
        
        // 添加头盔网罩
        const netGeometry = new THREE.SphereGeometry(0.56, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const netMaterial = new THREE.MeshPhongMaterial({
            color: 0x5A6D33,
            wireframe: true,
            shininess: 30
        });
        const net = new THREE.Mesh(netGeometry, netMaterial);
        net.position.y = 2.2;
        group.add(net);
        
        // 添加头盔带
        const strapGeometry = new THREE.TorusGeometry(0.5, 0.05, 8, 16, Math.PI);
        const strapMaterial = new THREE.MeshPhongMaterial({
            color: 0x2A2A2A,
            shininess: 20
        });
        const strap = new THREE.Mesh(strapGeometry, strapMaterial);
        strap.position.y = 2;
        strap.rotation.x = Math.PI / 2;
        group.add(strap);
        
        // 武器 - 更详细的步枪
        const gunGroup = new THREE.Group();
        
        // 枪身
        const gunBodyGeometry = new THREE.BoxGeometry(0.2, 0.2, 2);
        const gunBodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            shininess: 50
        });
        const gunBody = new THREE.Mesh(gunBodyGeometry, gunBodyMaterial);
        gunGroup.add(gunBody);
        
        // 枪托
        const stockGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.5);
        const stockMaterial = new THREE.MeshPhongMaterial({
            color: 0x4A3728,
            shininess: 30
        });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.z = -1.2;
        gunGroup.add(stock);
        
        // 瞄准镜
        const scopeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        const scopeMaterial = new THREE.MeshPhongMaterial({
            color: 0x2A2A2A,
            shininess: 60
        });
        const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
        scope.position.z = 0.5;
        scope.rotation.x = Math.PI / 2;
        gunGroup.add(scope);
        
        // 弹夹
        const magazineGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.2);
        const magazineMaterial = new THREE.MeshPhongMaterial({
            color: 0x2A2A2A,
            shininess: 40
        });
        const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial);
        magazine.position.y = -0.3;
        gunGroup.add(magazine);
        
        gunGroup.position.set(0.5, 1, 0.5);
        group.add(gunGroup);
        
        // 添加腿部
        const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
        const legMaterial = new THREE.MeshPhongMaterial({
            color: 0x2F4F2F,
            shininess: 20
        });
        
        // 左腿
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.3, -2.25, 0);
        group.add(leftLeg);
        
        // 右腿
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.3, -2.25, 0);
        group.add(rightLeg);
        
        // 添加护膝
        const kneepadGeometry = new THREE.SphereGeometry(0.25, 8, 8, 0, Math.PI);
        const kneepadMaterial = new THREE.MeshPhongMaterial({
            color: 0x2A2A2A,
            shininess: 30
        });
        
        // 左护膝
        const leftKneepad = new THREE.Mesh(kneepadGeometry, kneepadMaterial);
        leftKneepad.position.set(-0.3, -2, 0.2);
        leftKneepad.rotation.x = Math.PI / 2;
        group.add(leftKneepad);
        
        // 右护膝
        const rightKneepad = new THREE.Mesh(kneepadGeometry, kneepadMaterial);
        rightKneepad.position.set(0.3, -2, 0.2);
        rightKneepad.rotation.x = Math.PI / 2;
        group.add(rightKneepad);
        
        // 添加靴子
        const bootGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.6);
        const bootMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            shininess: 10
        });
        
        // 左靴子
        const leftBoot = new THREE.Mesh(bootGeometry, bootMaterial);
        leftBoot.position.set(-0.3, -3, 0);
        group.add(leftBoot);
        
        // 右靴子
        const rightBoot = new THREE.Mesh(bootGeometry, bootMaterial);
        rightBoot.position.set(0.3, -3, 0);
        group.add(rightBoot);
        
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
window.addEventListener('DOMContentLoaded', () => {
    window.gameBackground = new Background3D();
});

// 处理窗口大小变化
window.addEventListener('resize', () => {
    window.gameBackground.camera.aspect = window.innerWidth / window.innerHeight;
    window.gameBackground.camera.updateProjectionMatrix();
    window.gameBackground.renderer.setSize(window.innerWidth, window.innerHeight);
});