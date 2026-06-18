"""Print bounding-box size of each GLB so we know how much to scale for AR.
Scene Viewer treats 1 GLB unit = 1 meter. Components shown on a desk
should typically be 5-30 cm across.
"""
import sys
import struct
from pathlib import Path

from pygltflib import GLTF2

MODELS_DIR = Path(__file__).resolve().parent.parent / "assets" / "models"


def bbox_of(gltf: GLTF2) -> tuple[float, float, float]:
    """Compute world-space bbox over all meshes, applying node transforms.
    Returns (size_x, size_y, size_z) in GLB units (meters).
    """
    if not gltf.accessors:
        return (0, 0, 0)

    min_v = [float("inf")] * 3
    max_v = [float("-inf")] * 3

    # Walk scene -> nodes -> mesh -> primitives -> POSITION accessor.
    # Accumulate transforms down the hierarchy.
    def visit(node_idx, parent_scale):
        node = gltf.nodes[node_idx]
        s = node.scale or [1, 1, 1]
        cur_scale = [parent_scale[i] * s[i] for i in range(3)]
        # Translation is also relevant for bbox, but for "model size" we
        # care about the extent assuming the root is at origin; scale dominates.

        if node.mesh is not None:
            mesh = gltf.meshes[node.mesh]
            for prim in mesh.primitives:
                pos_accessor_idx = prim.attributes.POSITION
                if pos_accessor_idx is None:
                    continue
                acc = gltf.accessors[pos_accessor_idx]
                if acc.min and acc.max:
                    for i in range(3):
                        min_v[i] = min(min_v[i], acc.min[i] * cur_scale[i])
                        max_v[i] = max(max_v[i], acc.max[i] * cur_scale[i])
        for c in node.children or []:
            visit(c, cur_scale)

    scene_idx = gltf.scene if gltf.scene is not None else 0
    for root_idx in gltf.scenes[scene_idx].nodes:
        visit(root_idx, [1, 1, 1])

    if min_v[0] == float("inf"):
        return (0, 0, 0)
    return tuple(max_v[i] - min_v[i] for i in range(3))


def main() -> int:
    for glb in sorted(MODELS_DIR.glob("*.glb")):
        try:
            g = GLTF2().load(str(glb))
            sx, sy, sz = bbox_of(g)
            longest = max(sx, sy, sz)
            print(f"{glb.name:30s}  size = {sx:7.3f} x {sy:7.3f} x {sz:7.3f} m  (longest {longest:.3f} m)")
        except Exception as e:
            print(f"{glb.name}: ERROR {e}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
