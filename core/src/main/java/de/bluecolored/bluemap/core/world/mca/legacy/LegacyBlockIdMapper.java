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
package de.bluecolored.bluemap.core.world.mca.legacy;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import de.bluecolored.bluemap.core.logger.Logger;
import de.bluecolored.bluemap.core.world.BlockState;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Numeric block id and metadata to {@link BlockState}, for worlds written before the
 * flattening.
 *
 * A pre-flattening chunk does not name its blocks. It stores a numeric id and four bits
 * of metadata per block, and what those numbers mean is knowledge that lives outside the
 * world - which is why upstream shipped it as a resource rather than as code. This is
 * that resource, `blockIds.json`, taken verbatim from upstream's own
 * {@code v0.10.3-mc1.12} tag rather than re-typed, because a table of 3,000 mappings
 * transcribed by hand is a table with mistakes in it that nobody will find until one
 * particular block renders wrong.
 *
 * The lookup order matches upstream's {@code BlockIdConfig}: a mod's string id first when
 * one is known, then the numeric id with its exact metadata, then the numeric id with
 * metadata zero. That last fallback matters more than it looks - most blocks vary only in
 * their metadata, so a variant nobody mapped still renders as its base block rather than
 * as nothing at all.
 */
public class LegacyBlockIdMapper {

    private static final String RESOURCE = "/de/bluecolored/bluemap/core/world/mca/legacy/blockIds.json";

    /** What an unmappable id becomes. Air, deliberately - see {@link #get}. */
    private static final BlockState FALLBACK = BlockState.AIR;

    private final Map<String, BlockState> numeralMappings = new HashMap<>();
    private final Map<String, BlockState> idMappings = new HashMap<>();

    /**
     * Resolutions worked out at run time, remembered.
     *
     * A chunk asks for the same handful of ids millions of times, and the fallback path
     * parses a string every time it is taken. Concurrent because chunks are decoded on
     * several threads.
     */
    private final Map<String, BlockState> resolved = new ConcurrentHashMap<>();

    private static LegacyBlockIdMapper instance;

    public static synchronized LegacyBlockIdMapper defaultMapper() {
        if (instance == null) instance = new LegacyBlockIdMapper();
        return instance;
    }

    private LegacyBlockIdMapper() {
        Map<String, String> raw = load();
        for (Map.Entry<String, String> entry : raw.entrySet()) {
            String key = entry.getKey();
            BlockState state;
            try {
                state = BlockState.fromString(entry.getValue());
            } catch (IllegalArgumentException ex) {
                // One unreadable line is one unreadable mapping. Losing the whole table
                // because of it would turn every legacy world into air.
                Logger.global.noFloodWarning("legacy-blockid-parse",
                        "Ignoring unreadable legacy block mapping '" + key + "': " + ex.getMessage());
                continue;
            }

            int separator = key.lastIndexOf(':');
            if (separator < 0) continue;
            String idPart = key.substring(0, separator);
            String metaPart = key.substring(separator + 1);

            int meta;
            try {
                meta = Integer.parseInt(metaPart);
            } catch (NumberFormatException ex) {
                continue;
            }

            // A key is either "12:0" (numeric) or "minecraft:stone:0" (a string id, which
            // a mod uses). Upstream kept two maps for exactly this reason and so does this.
            if (isNumeric(idPart)) {
                numeralMappings.put(idPart + ":" + meta, state);
            } else {
                idMappings.put(idPart + ":" + meta, state);
            }
        }
    }

    private static boolean isNumeric(String value) {
        if (value.isEmpty()) return false;
        for (int i = 0; i < value.length(); i++) {
            if (!Character.isDigit(value.charAt(i))) return false;
        }
        return true;
    }

    private static Map<String, String> load() {
        try (InputStream in = LegacyBlockIdMapper.class.getResourceAsStream(RESOURCE)) {
            if (in == null) {
                // Said out loud rather than silently returning an empty table: an empty
                // table renders every legacy world as air, which looks like a broken world
                // rather than a missing resource.
                Logger.global.logError("Legacy block-id mappings are missing from this build ("
                        + RESOURCE + "). Worlds older than 1.13 cannot be read.", new IOException("resource not found"));
                return Map.of();
            }
            Type type = new TypeToken<Map<String, String>>() {}.getType();
            return new Gson().fromJson(new InputStreamReader(in, StandardCharsets.UTF_8), type);
        } catch (IOException | RuntimeException ex) {
            Logger.global.logError("Failed to read the legacy block-id mappings.", ex);
            return Map.of();
        }
    }

    /** The block for a numeric id and metadata, as a pre-flattening chunk stores them. */
    public BlockState get(int id, int meta) {
        return get(null, id, meta);
    }

    /**
     * The block for a string id when one is known, falling back to the numeric id.
     *
     * Returns air rather than null for anything unmappable. Upstream made the same
     * choice and it is the right one here: a chunk with one unknown block should render
     * with a hole in it, not fail to render at all.
     */
    public BlockState get(String id, int numeralId, int meta) {
        String cacheKey = (id == null ? "" : id) + "|" + numeralId + ":" + meta;
        BlockState cached = resolved.get(cacheKey);
        if (cached != null) return cached;

        BlockState state = resolve(id, numeralId, meta);
        resolved.put(cacheKey, state);
        return state;
    }

    private BlockState resolve(String id, int numeralId, int meta) {
        if (id != null) {
            BlockState byId = idMappings.get(id + ":" + meta);
            if (byId != null) return byId;
            BlockState byIdBase = idMappings.get(id + ":0");
            if (byIdBase != null) return byIdBase;
        }

        BlockState byNumeral = numeralMappings.get(numeralId + ":" + meta);
        if (byNumeral != null) return byNumeral;

        // Metadata zero last. A variant nobody mapped still renders as its base block,
        // which is very nearly right, rather than as air, which is visibly wrong.
        BlockState byNumeralBase = numeralMappings.get(numeralId + ":0");
        if (byNumeralBase != null) return byNumeralBase;

        Logger.global.noFloodDebug("legacy-blockid-miss-" + numeralId,
                "No legacy mapping for block id " + numeralId + ":" + meta + " - rendering it as air.");
        return FALLBACK;
    }
}
