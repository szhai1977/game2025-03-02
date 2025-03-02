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

class EnemySoldier(Soldier):
    def __init__(self):
        super().__init__()
        # 可以在这里添加敌人士兵的特定属性和方法

    def move(self, x, y):
        # 可以在这里自定义敌人士兵的移动逻辑
        super().move(x, y)

    def attack(self):
        # 敌人士兵的攻击行为
        print("敌人士兵攻击！") 