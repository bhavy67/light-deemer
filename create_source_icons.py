#!/usr/bin/env python3
import struct
import zlib

def create_png(width, height, color=(64, 64, 64)):
    """Create a simple PNG with the given dimensions and color"""
    def png_pack(tag, data):
        checksum = zlib.crc32(tag + data) & 0xffffffff
        return struct.pack("!I", len(data)) + tag + data + struct.pack("!I", checksum)
    
    # PNG signature
    png_data = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack("!2I5B", width, height, 8, 2, 0, 0, 0)
    png_data += png_pack(b'IHDR', ihdr_data)
    
    # IDAT chunk (image data)
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # filter type
        for x in range(width):
            raw_data += bytes(color)  # RGB
    
    idat_data = zlib.compress(raw_data)
    png_data += png_pack(b'IDAT', idat_data)
    
    # IEND chunk
    png_data += png_pack(b'IEND', b'')
    
    return png_data

# Create icons in source folder so webpack copies them
for size in [16, 48, 128]:
    png_data = create_png(size, size, (64, 64, 64))
    with open(f'icons/icon{size}.png', 'wb') as f:
        f.write(png_data)
    print(f"Created source {size}px icon")
