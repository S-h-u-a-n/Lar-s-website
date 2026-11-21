"""Tiny transparent PNG tile placeholders, authored in code; no dependencies.
Never overwrite hand-drawn tiles unless --overwrite is explicitly supplied.
"""
import argparse
import math
import struct
import zlib
from pathlib import Path

PALETTES = {
    'grass': ['719783', '80a48b', '92b299', 'a6bda0'],
    'dry-grass': ['a5b28a', 'b6bd92', 'c3c39b', 'bdbe91'],
    'soil': ['ad9276', 'ba9c7c', 'c4a786', 'b1977d'],
    'rock': ['75888b', '8e9a99', 'a4aaa1', 'b8b9a9'],
    'sand': ['d4b98b', 'dfc99c', 'edd9ad', 'f1e4bf'],
    'water': ['5296b5', '62a6c3', '76b4cf', '8cc9da'],
    'ice': ['aaceda', 'bfdae5', 'd8e9ed', 'eff5ed'],
    'basalt': ['53616b', '63747b', '788589', '8f9896'],
    'lava': ['d77f66', 'ed9a70', 'f9c47b', 'ecac75'],
}

def noise(x, y):
    return ((x * 374761393 + y * 668265263 + 6307) ^ ((x * 71 + y * 133) << 11)) % 65521 / 65521

def rgb(color):
    return tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))

def write_png(path, width, height, pixels):
    def chunk(kind, data):
        return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data) & 0xffffffff)
    rows = b''.join(b'\x00' + bytes(pixels[y * width * 4:(y + 1) * width * 4]) for y in range(height))
    header = struct.pack('!2I5B', width, height, 8, 6, 0, 0, 0)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b''))

def tile(name, qa=False):
    side = name.startswith('side-')
    width, height = 64, 64 if side else 32
    pixels = []
    for y in range(height):
        for x in range(width):
            n = noise(x // 3, y // 2)
            color = (0, 0, 0, 0)
            diamond = abs(x + .5 - 32) / 32 + abs(y + .5 - 16) / 16 <= 1
            if side:
                sx = x if name == 'side-left' else 63 - x
                if 0 <= sx < 32 and 16 + sx / 2 <= y + .5 < 32 + sx / 2:
                    shades = ['697d80', '83928a', '9aa28e', '778a86']
                    color = (*rgb(shades[(int((y - sx / 2) / 3) + int(n * 2)) % 4]), 255)
            elif diamond:
                if name == 'snow':
                    color = (245, 248, 240, 230 if n > .28 else 110)
                elif name == 'wet':
                    patch = ((x - 32) / 20) ** 2 + ((y - 17) / 7) ** 2
                    if patch < .85 + n * .5:
                        color = (123, 190, 205, 145 if n > .25 else 85)
                elif name == 'foam-edge':
                    if x < 32 and y < 16 and abs(x / 32 + y / 16 - 1) < .14 and n > .13:
                        color = (222, 242, 233, 225)
                else:
                    shades = ['9c79be', 'b698ce', 'd1b6de', 'b68dca'] if qa else PALETTES[name]
                    color = (*rgb(shades[min(3, int(n * 4))]), 255)
            pixels.extend(color)
    return width, height, pixels

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--overwrite', action='store_true')
    parser.add_argument('--qa-grass', type=Path, help='Write a purple QA grass PNG at this path only')
    args = parser.parse_args()
    if args.qa_grass:
        write_png(args.qa_grass, *tile('grass', qa=True))
    else:
        root = Path(__file__).parent / 'tileset'
        for name in [*PALETTES, 'side-left', 'side-right', 'snow', 'wet', 'foam-edge']:
            path = root / f'{name}.png'
            if not path.exists() or args.overwrite:
                write_png(path, *tile(name))
        print(f'Placeholder tiles ready in {root}')
