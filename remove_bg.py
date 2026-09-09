from PIL import Image, ImageDraw
import math

def remove_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Calculate distance from white (255, 255, 255)
    def dist_from_white(r, g, b):
        return math.sqrt((255 - r)**2 + (255 - g)**2 + (255 - b)**2)

    # Identify white background pixels via flood fill starting from image borders
    is_bg = [[False] * width for _ in range(height)]
    queue = []

    for x in range(width):
        r, g, b, a = pixels[x, 0]
        if dist_from_white(r, g, b) < 40:
            is_bg[0][x] = True
            queue.append((x, 0))
        r, g, b, a = pixels[x, height - 1]
        if dist_from_white(r, g, b) < 40:
            is_bg[height - 1][x] = True
            queue.append((x, height - 1))

    for y in range(height):
        r, g, b, a = pixels[0, y]
        if dist_from_white(r, g, b) < 40 and not is_bg[y][0]:
            is_bg[y][0] = True
            queue.append((0, y))
        r, g, b, a = pixels[width - 1, y]
        if dist_from_white(r, g, b) < 40 and not is_bg[y][width - 1]:
            is_bg[y][width - 1] = True
            queue.append((width - 1, y))

    head = 0
    neighbors = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    while head < len(queue):
        cx, cy = queue[head]
        head += 1

        for dx, dy in neighbors:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < width and 0 <= ny < height:
                if not is_bg[ny][nx]:
                    r, g, b, a = pixels[nx, ny]
                    if dist_from_white(r, g, b) < 40:
                        is_bg[ny][nx] = True
                        queue.append((nx, ny))

    # Convert bg pixels to transparent with smooth edge transition
    for y in range(height):
        for x in range(width):
            if is_bg[y][x]:
                r, g, b, a = pixels[x, y]
                d = dist_from_white(r, g, b)
                if d <= 15:
                    pixels[x, y] = (r, g, b, 0)
                else:
                    alpha = int(255 * (d - 15) / (40 - 15))
                    pixels[x, y] = (r, g, b, max(0, min(255, alpha)))

    # Crop to content bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    img.save(output_path, "PNG")
    print(f"Successfully processed {input_path} -> {output_path}, new size: {img.size}")

if __name__ == "__main__":
    remove_background("public/mytrikart-logo.png", "public/mytrikart-logo-transparent.png")
    remove_background("public/mytrikart-logo-transparent.png", "public/mytrikart-logo.png")
