class Tank:
    def __init__(self):
        self.health = 100
        self.is_alive = True
        self.position = {'x': 0, 'y': 0}
        self.color = 'white'  # 设置坦克颜色为白色
    
    def move(self, x, y):
        self.position['x'] = x
        self.position['y'] = y
    
    def collide_with_soldier(self, soldier):
        if self.is_alive:
            print("坦克撞到了士兵！坦克被摧毁了！")
            self.is_alive = False
            self.health = 0
    
    def is_destroyed(self):
        return not self.is_alive 