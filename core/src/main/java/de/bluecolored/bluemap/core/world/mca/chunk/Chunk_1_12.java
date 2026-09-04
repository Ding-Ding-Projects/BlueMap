/*
 * This file is part of BlueMap, licensed under the MIT License (MIT).
 *
 * Copyright (c) Blue (Lukas Rieger) <https://bluecolored.de>
 * Copyright (c) contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
package de.bluecolored.bluemap.core.world.mca.chunk;

import de.bluecolored.bluemap.core.world.BlockState;
import de.bluecolored.bluemap.core.world.LightData;
import de.bluecolored.bluemap.core.world.biome.Biome;
import de.bluecolored.bluemap.core.world.mca.MCAWorld;
import de.bluecolored.bluemap.core.world.mca.legacy.LegacyBlockIdMapper;
import de.bluecolored.bluenbt.NBTName;
import lombok.Getter;
import org.jetbrains.annotations.Nullable;

import java.util.Arrays;

/**
 * Chunks written before the flattening: Minecraft 1.12.2 and older, DataVersion 1343
 * and below.
 *
 * A pre-flattening chunk does not name its blocks. Each one is a numeric id in a byte
 * array, optionally extended past 255 by a nibble in {@code Add}, with four bits of
 * metadata in a parallel {@code Data} nibble array. From 1.13 onward a section instead
 * carries a palette of named block states and an index per block, and the two layouts
 * have nothing in common.
 *
 * That difference is why this class exists rather than the loader simply being made
 * lenient. {@link Chunk_1_13} had a minimum DataVersion of 0, so an old chunk did not
 * fail to load - it was handed to a decoder that read those byte arrays as though they
 * were a palette and an index. Nothing threw. The chunk came out empty, and an empty
 * chunk renders as a hole in the map, which is why worlds from this era came out full of
 * black squares while the logs stayed clean.
 *
 * Where this came from. The decoding is upstream's own, from {@code ChunkAnvil112} at
 * tag {@code v0.10.3-mc1.12}, and the numeric-id table is upstream's `blockIds.json`
 * resource taken verbatim rather than re-typed. The shape - fitting that decoding into
 * the modern {@code MCAChunk} architecture with its section-offset array and
 * {@code LightData} target - follows this project's own TypeScript port of the same
 * upstream source, which is credited in NOTICE and has its own tests.
 *
 * What pre-1.13 chunks do not have, and this therefore does not pretend to: an
 * ocean-floor heightmap (the inherited default of false/0 stands), a {@code Status}
 * string (the boolean {@code TerrainPopulated} answers "is it generated" instead), and
 * block entities in the modern shape.
 */
public class Chunk_1_12 extends MCAChunk {

    private static final int BLOCKS_PER_SECTION = 16 * 16 * 16;
    private static final int NIBBLES_PER_SECTION = BLOCKS_PER_SECTION / 2;
    private static final int VALUES_PER_HEIGHTMAP = 16 * 16;

    private static final byte[] EMPTY_BYTE_ARRAY = new byte[0];
    private static final int[] EMPTY_INT_ARRAY = new int[0];

    private final boolean generated;
    private final boolean hasLightData;
    private final long inhabitedTime;

    private final int skyLight;

    private final boolean hasWorldSurfaceHeights;
    private final int[] worldSurfaceHeights;

    private final Section[] sections;
    private final int sectionMin, sectionMax;

    private final byte[] biomes;

    public Chunk_1_12(MCAWorld world, Data data) {
        super(world, data);

        Level level = data.level;

        // Pre-1.13 has no Status string. These two booleans are the whole of what the
        // format says about how finished a chunk is.
        this.generated = level.terrainPopulated;
        this.hasLightData = level.lightPopulated;
        this.inhabitedTime = level.inhabitedTime;

        this.skyLight = getWorld().getDimensionType().hasSkylight() ? 15 : 0;

        this.worldSurfaceHeights = level.heightMap;
        this.hasWorldSurfaceHeights = this.worldSurfaceHeights.length >= VALUES_PER_HEIGHTMAP;

        this.biomes = level.biomes;

        // The sections are stored in a section-min-offset array, the way Chunk_1_13 does
        // it, rather than the legacy fixed Section[32]. Keeping the modern layout is what
        // lets everything above this class stay unaware that the chunk is old.
        SectionData[] sectionsData = level.sections;
        if (sectionsData != null && sectionsData.length > 0) {
            int min = Integer.MAX_VALUE;
            int max = Integer.MIN_VALUE;

            for (SectionData sectionData : sectionsData) {
                int y = sectionData.getY();
                if (min > y) min = y;
                if (max < y) max = y;
            }

            this.sectionMin = min;
            this.sectionMax = max;
            this.sections = new Section[1 + max - min];

            LegacyBlockIdMapper blockIdMapper = LegacyBlockIdMapper.defaultMapper();
            for (SectionData sectionData : sectionsData) {
                Section section = new Section(sectionData, blockIdMapper);
                this.sections[section.getSectionY() - min] = section;
            }
        } else {
            this.sectionMin = 0;
            this.sectionMax = 0;
            this.sections = new Section[0];
        }
    }

    @Override
    public boolean isGenerated() {
        return generated;
    }

    @Override
    public boolean hasLightData() {
        return hasLightData;
    }

    @Override
    public long getInhabitedTime() {
        return inhabitedTime;
    }

    @Override
    public BlockState getBlockState(int x, int y, int z) {
        Section section = getSection(y >> 4);
        if (section == null) return BlockState.AIR;
        return section.getBlockState(x, y, z);
    }

    @Override
    public LightData getLightData(int x, int y, int z, LightData target) {
        // The legacy renderer answered "full skylight" for a chunk with no light data at
        // all. Keeping that rather than answering darkness matters: darkness would render
        // an unlit old world as solid black, which is the failure this whole class exists
        // to remove.
        if (!hasLightData) return target.set(skyLight, 0);

        int sectionY = y >> 4;
        Section section = getSection(sectionY);
        if (section == null)
            return sectionY < sectionMin ? target.set(0, 0) : target.set(skyLight, 0);

        return section.getLightData(x, y, z, target);
    }

    @Override
    public Biome getBiome(int x, int y, int z) {
        // One byte per column, not per block: pre-1.13 biomes are two-dimensional, so the
        // y argument is deliberately unused.
        int biomeByteIndex = (z & 0xF) * 16 + (x & 0xF);
        if (biomeByteIndex >= biomes.length) return Biome.DEFAULT;

        // The data pack already owns the legacy id table and exposes it for exactly
        // this: getBiome(int) is the legacy-id overload, not the modern key one.
        Biome biome = getWorld().getDataPack().getBiome(biomes[biomeByteIndex] & 0xFF);
        return biome != null ? biome : Biome.DEFAULT;
    }

    @Override
    public int getMinY(int x, int z) {
        return sectionMin * 16;
    }

    @Override
    public int getMaxY(int x, int z) {
        return sectionMax * 16 + 15;
    }

    @Override
    public boolean hasWorldSurfaceHeights() {
        return hasWorldSurfaceHeights;
    }

    @Override
    public int getWorldSurfaceY(int x, int z) {
        return worldSurfaceHeights[((z & 0xF) << 4) | (x & 0xF)];
    }

    private @Nullable Section getSection(int y) {
        y -= sectionMin;
        if (y < 0 || y >= sections.length) return null;
        return sections[y];
    }

    /**
     * The four bits of one nibble.
     *
     * Two blocks share a byte. {@code largeHalf} picks the high nibble, which is the
     * second of the pair.
     */
    private static int getByteHalf(int value, boolean largeHalf) {
        value = value & 0xFF;
        if (largeHalf) value = value >> 4;
        return value & 0xF;
    }

    /** Zero-padded {@code Arrays.copyOf}, so a short array cannot index out of bounds. */
    private static byte[] padded(byte[] array, int length) {
        return array.length >= length ? array : Arrays.copyOf(array, length);
    }

    private static class Section {

        @Getter
        private final int sectionY;
        private final byte[] blocks;
        private final byte[] add;
        private final byte[] blockLight;
        private final byte[] skyLight;
        private final byte[] data;

        private final LegacyBlockIdMapper blockIdMapper;

        Section(SectionData sectionData, LegacyBlockIdMapper blockIdMapper) {
            this.sectionY = sectionData.getY();
            this.add = sectionData.getAdd();

            // Padded rather than trusted. A truncated array is a corrupt chunk, and a
            // corrupt chunk should render as air rather than throw out of a render that
            // has been running for an hour.
            this.blocks = padded(sectionData.getBlocks(), BLOCKS_PER_SECTION);
            this.blockLight = padded(sectionData.getBlockLight(), NIBBLES_PER_SECTION);
            this.skyLight = padded(sectionData.getSkyLight(), NIBBLES_PER_SECTION);
            this.data = padded(sectionData.getData(), NIBBLES_PER_SECTION);

            this.blockIdMapper = blockIdMapper;
        }

        BlockState getBlockState(int x, int y, int z) {
            int blockByteIndex = (y & 0xF) * 256 + (z & 0xF) * 16 + (x & 0xF);
            int blockHalfByteIndex = blockByteIndex >> 1;
            boolean largeHalf = (blockByteIndex & 0x1) != 0;

            int blockId = blocks[blockByteIndex] & 0xFF;

            // `Add` carries bits 8-11, for the ids past 255 that mods used.
            if (add.length > blockHalfByteIndex) {
                blockId = blockId | (getByteHalf(add[blockHalfByteIndex], largeHalf) << 8);
            }

            int blockData = getByteHalf(data[blockHalfByteIndex], largeHalf);
            return blockIdMapper.get(blockId, blockData);
        }

        LightData getLightData(int x, int y, int z, LightData target) {
            int blockByteIndex = (y & 0xF) * 256 + (z & 0xF) * 16 + (x & 0xF);
            int blockHalfByteIndex = blockByteIndex >> 1;
            boolean largeHalf = (blockByteIndex & 0x1) != 0;

            return target.set(
                    getByteHalf(skyLight[blockHalfByteIndex], largeHalf),
                    getByteHalf(blockLight[blockHalfByteIndex], largeHalf)
            );
        }
    }

    @Getter
    @SuppressWarnings("FieldMayBeFinal")
    public static class Data extends MCAChunk.Data {

        @NBTName("Level")
        private Level level = new Level();

    }

    @Getter
    @SuppressWarnings("FieldMayBeFinal")
    public static class Level {

        @NBTName("TerrainPopulated")
        private boolean terrainPopulated = false;

        @NBTName("LightPopulated")
        private boolean lightPopulated = false;

        @NBTName("InhabitedTime")
        private long inhabitedTime = 0;

        /** {@code int[256]}, indexed {@code z * 16 + x}. Pre-1.13 has no packed heightmap. */
        @NBTName("HeightMap")
        private int[] heightMap = EMPTY_INT_ARRAY;

        /** One byte per column, not the modern per-block int array. */
        @NBTName("Biomes")
        private byte[] biomes = EMPTY_BYTE_ARRAY;

        @NBTName("Sections")
        private SectionData @Nullable [] sections = null;

    }

    @Getter
    @SuppressWarnings("FieldMayBeFinal")
    public static class SectionData {

        @NBTName("Y")
        private int y = 0;

        /** One byte per block: the low eight bits of the numeric id. */
        @NBTName("Blocks")
        private byte[] blocks = EMPTY_BYTE_ARRAY;

        /** A nibble per block: bits 8-11 of the id, present only when a mod needed them. */
        @NBTName("Add")
        private byte[] add = EMPTY_BYTE_ARRAY;

        /** A nibble per block: the four metadata bits. */
        @NBTName("Data")
        private byte[] data = EMPTY_BYTE_ARRAY;

        @NBTName("BlockLight")
        private byte[] blockLight = EMPTY_BYTE_ARRAY;

        @NBTName("SkyLight")
        private byte[] skyLight = EMPTY_BYTE_ARRAY;

    }

}
