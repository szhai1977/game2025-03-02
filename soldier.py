class Bullet:
    def __init__(self):
        self.speed = 10
        self.damage = 5
        self.color = 'white'  # 设置子弹颜色为白色
        
    def hit(self):
        print(f"子弹造成了 {self.damage} 点伤害!")

class Soldier:
    def __init__(self):
        self.bullets = []
        self.color = 'white'  # 设置士兵颜色为白色
        self.health = 100  # 设置初始生命值
    
    def shoot(self):
        # 创建新子弹并发射
        bullet = Bullet()
        self.bullets.append(bullet)
        print("士兵发射了一颗子弹!")
        
    def get_bullets(self):
        return self.bullets 

    def take_damage(self, amount):
        self.health -= amount
        if self.health < 0:
            self.health = 0
        print(f"士兵受到了 {amount} 点伤害, 剩余生命值: {self.health}")
        
    def move(self, x, y):
        # 移动士兵到指定位置
        self.position_x = x
        self.position_y = y

class EnemySoldier(Soldier):
    def __init__(self):
        super().__init__()
        self.attack_power = 10  # 敌人士兵的攻击力
        self.attack_range = 100  # 敌人士兵的攻击范围
        
    def move(self, x, y):
        # 可以在这里自定义敌人士兵的移动逻辑
        super().move(x, y)

    def attack(self):
        # 敌人士兵的攻击行为
        print("敌人士兵攻击！")
        return self.attack_power
        
    def attack_tank(self, tank):
        """敌人士兵攻击坦克"""
        if tank.is_alive:
            damage = self.attack_power
            print(f"敌人士兵攻击坦克，造成 {damage} 点伤害!")
            tank.take_damage(damage)
            return True
        return False
        
    def is_in_range(self, target_x, target_y):
        """检查目标是否在攻击范围内"""
        distance = ((self.position_x - target_x) ** 2 + (self.position_y - target_y) ** 2) ** 0.5
        return distance <= self.attack_range 