class Bullet:
    def __init__(self):
        self.speed = 10
        self.damage = 5
        
    def hit(self):
        print(f"子弹造成了 {self.damage} 点伤害!") 