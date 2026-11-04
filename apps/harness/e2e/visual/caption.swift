import AppKit
// usage: caption <out.png> <width> <height> <text> [hexColor]
let a = CommandLine.arguments
let w = Int(a[2])!, h = Int(a[3])!
let color = a.count > 5 ? a[5] : "ffffff"
func hex(_ s: String) -> NSColor { let v = Int(s, radix: 16)!; return NSColor(red: CGFloat((v >> 16) & 255) / 255, green: CGFloat((v >> 8) & 255) / 255, blue: CGFloat(v & 255) / 255, alpha: 1) }
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
NSColor(white: 0.07, alpha: 1).setFill(); NSRect(x: 0, y: 0, width: w, height: h).fill()
let style = NSMutableParagraphStyle(); style.alignment = .left
let attrs: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 30, weight: .semibold), .foregroundColor: hex(color), .paragraphStyle: style]
NSString(string: a[4].replacingOccurrences(of: "\\n", with: "\n")).draw(in: NSRect(x: 24, y: 10, width: w - 48, height: h - 24), withAttributes: attrs)
NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[1]))
