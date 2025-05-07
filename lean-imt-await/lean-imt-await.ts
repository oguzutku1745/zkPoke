import {
    requireArray,
    requireFunction,
    requireDefined,
    requireNumber,
    requireString
} from "@zk-kit/utils/error-handlers"
import { LeanIMTHashFunction, LeanIMTMerkleProof } from "./types"
import { poseidon2Hash } from "@aztec/foundation/crypto"
import { Fr } from "@aztec/foundation/fields"

export default class LeanIMT<N extends Fr = Fr> {
    private _nodes: N[][]
    private readonly _hash: LeanIMTHashFunction<N>

    constructor(hash?: LeanIMTHashFunction<N>, leaves: N[] = []) {
        const defaultHash = async (a: N, b: N) => new Fr(await poseidon2Hash([a, b])) as N
        this._hash = hash ?? defaultHash

        requireDefined(this._hash, "hash")
        requireFunction(this._hash, "hash")
        requireArray(leaves, "leaves")

        this._nodes = [[]]
    }

    public get root(): N {
        return this._nodes[this.depth][0]
    }

    public get depth(): number {
        return this._nodes.length - 1
    }

    public get leaves(): N[] {
        return this._nodes[0].slice()
    }

    public get size(): number {
        return this._nodes[0].length
    }

    public get siblings(): N[][] {
        return this._nodes.slice(0, -1).map((level, i) => {
            return level.filter((_, index) => index % 2 === 1)
        })
    }

    public get indices(): number[] {
        return Array.from({ length: this.size }, (_, i) => i)
    }

    public indexOf(leaf: N): number {
        requireDefined(leaf, "leaf")
        return this._nodes[0].indexOf(leaf)
    }

    public has(leaf: N): boolean {
        requireDefined(leaf, "leaf")
        return this._nodes[0].includes(leaf)
    }

    public async insert(leaf: N) {
        requireDefined(leaf, "leaf")

        if (this.depth < Math.ceil(Math.log2(this.size + 1))) {
            this._nodes.push([])
        }

        let node = leaf
        let index = this.size

        for (let level = 0; level < this.depth; level += 1) {
            this._nodes[level][index] = node

            if (index & 1) {
                const sibling = this._nodes[level][index - 1]
                node = await this._hash(sibling, node)
            }

            index >>= 1
        }

        this._nodes[this.depth] = [node]
    }

    public async insertMany(leaves: N[]) {
        requireDefined(leaves, "leaves")
        requireArray(leaves, "leaves")

        if (leaves.length === 0) {
            throw new Error("There are no leaves to add")
        }

        let startIndex = this.size >> 1

        this._nodes[0] = this._nodes[0].concat(leaves)

        const numberOfNewLevels = Math.ceil(Math.log2(this.size)) - this.depth

        for (let i = 0; i < numberOfNewLevels; i += 1) {
            this._nodes.push([])
        }

        for (let level = 0; level < this.depth; level += 1) {
            const numberOfNodes = Math.ceil(this._nodes[level].length / 2)

            for (let index = startIndex; index < numberOfNodes; index += 1) {
                const rightNode = this._nodes[level][index * 2 + 1]
                const leftNode = this._nodes[level][index * 2]

                const parentNode = rightNode ? await this._hash(leftNode, rightNode) : leftNode

                this._nodes[level + 1][index] = parentNode
            }

            startIndex >>= 1
        }
    }

    public async update(index: number, newLeaf: N) {
        requireDefined(index, "index")
        requireDefined(newLeaf, "newLeaf")
        requireNumber(index, "index")

        let node = newLeaf

        for (let level = 0; level < this.depth; level += 1) {
            this._nodes[level][index] = node

            if (index & 1) {
                const sibling = this._nodes[level][index - 1]
                node = await this._hash(sibling, node)
            } else {
                const sibling = this._nodes[level][index + 1]

                if (sibling !== undefined) {
                    node = await this._hash(node, sibling)
                }
            }

            index >>= 1
        }

        this._nodes[this.depth] = [node]
    }

    public async updateMany(indices: number[], leaves: N[]) {
        requireDefined(leaves, "leaves")
        requireDefined(indices, "indices")
        requireArray(leaves, "leaves")
        requireArray(indices, "indices")

        if (leaves.length !== indices.length) {
            throw new Error("There is no correspondence between indices and leaves")
        }

        let modifiedIndices = new Set<number>()
        for (let i = 0; i < indices.length; i += 1) {
            requireNumber(indices[i], `index ${i}`)
            if (indices[i] < 0 || indices[i] >= this.size) {
                throw new Error(`Index ${i} is out of range`)
            }
            if (modifiedIndices.has(indices[i])) {
                throw new Error(`Leaf ${indices[i]} is repeated`)
            }
            modifiedIndices.add(indices[i])
        }

        modifiedIndices.clear()
        for (let leaf = 0; leaf < indices.length; leaf += 1) {
            this._nodes[0][indices[leaf]] = leaves[leaf]
            modifiedIndices.add(indices[leaf] >> 1)
        }

        for (let level = 1; level <= this.depth; level += 1) {
            const newModifiedIndices: number[] = []
            for (const index of modifiedIndices) {
                const leftChild = this._nodes[level - 1][2 * index]
                const rightChild = this._nodes[level - 1][2 * index + 1]
                this._nodes[level][index] = rightChild ? await this._hash(leftChild, rightChild) : leftChild
                newModifiedIndices.push(index >> 1)
            }
            modifiedIndices = new Set<number>(newModifiedIndices)
        }
    }

    public generateProof(index: number): LeanIMTMerkleProof<N> {
        requireDefined(index, "index")
        requireNumber(index, "index")

        if (index < 0 || index >= this.size) {
            throw new Error(`The leaf at index '${index}' does not exist in this tree`)
        }

        const leaf = this.leaves[index]
        const siblings: N[] = []
        const path: number[] = []

        for (let level = 0; level < this.depth; level += 1) {
            const isRightNode = index & 1
            const siblingIndex = isRightNode ? index - 1 : index + 1
            const sibling = this._nodes[level][siblingIndex]

            if (sibling !== undefined) {
                path.push(isRightNode)
                siblings.push(sibling)
            }

            index >>= 1
        }

        return { root: this.root, leaf, index: Number.parseInt(path.reverse().join(""), 2), siblings }
    }

    public async verifyProof(proof: LeanIMTMerkleProof<N>): Promise<boolean> {
        return LeanIMT.verifyProof(proof, this._hash)
    }

    public static async verifyProof<N>(proof: LeanIMTMerkleProof<N>, hash: LeanIMTHashFunction<N>): Promise<boolean> {
        requireDefined(proof, "proof")

        const { root, leaf, siblings, index } = proof

        requireDefined(proof.root, "proof.root")
        requireDefined(proof.leaf, "proof.leaf")
        requireDefined(proof.siblings, "proof.siblings")
        requireDefined(proof.index, "proof.index")

        requireArray(proof.siblings, "proof.siblings")
        requireNumber(proof.index, "proof.index")

        let node = leaf

        for (let i = 0; i < siblings.length; i += 1) {
            if ((index >> i) & 1) {
                node = await hash(siblings[i], node)
            } else {
                node = await hash(node, siblings[i])
            }
        }

        return (root as any)?.equals
            ? (root as any).equals(node as any) // use Fr.equals when available
            : root === node     
    }

    public export(): string {
        return JSON.stringify(this._nodes, (_, v) => (typeof v === "bigint" ? v.toString() : v))
    }

    static import<N extends Fr = Fr>(hash: LeanIMTHashFunction<N>, nodes: string, map?: (value: string) => N): LeanIMT<N> {
        requireDefined(hash, "hash")
        requireDefined(nodes, "nodes")
        requireFunction(hash, "hash")
        requireString(nodes, "nodes")

        if (map) {
            requireDefined(map, "map")
            requireFunction(map, "map")
        }

        const tree = new LeanIMT<N>(hash)

        tree._nodes = JSON.parse(nodes, (_, value) => {
            if (typeof value === "string") {
                return map ? map(value) : BigInt(value)
            }

            return value
        })

        return tree
    }
}
