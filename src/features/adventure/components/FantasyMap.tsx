import { useRef, useLayoutEffect } from 'react';
import { MapPathSVG } from './MapPathSVG';
import { MapNode } from './MapNode';
import type { Adventure, Encounter } from '../../../types/adventure.types';
import { getAdventureMapImage } from '../../../data/adventure-assets';
import { useGameStore } from '../../../stores/game/store';

interface FantasyMapProps {
    adventure: Adventure;
    currentNode: number;
    onNodeClick: (node: Encounter) => void;
}

export const FantasyMap: React.FC<FantasyMapProps> = ({ adventure, currentNode, onNodeClick }) => {
    const currentNodeRef = useRef<HTMLDivElement>(null);
    const mapImageRef = useRef<HTMLImageElement>(null);

    // Reference height based on original design (where nodes were placed)
    // Looking at current data, nodes go up to y: 3900.
    // The previous min-height was 4500px.
    const referenceHeight = 4500;

    const mapImage = getAdventureMapImage(adventure.id);

    const { getAdventureNodes } = useGameStore();

    useLayoutEffect(() => {
        if (currentNodeRef.current) {
            currentNodeRef.current.scrollIntoView({
                behavior: 'instant',
                block: 'center'
            });
        }
    }, [currentNode]);

    const { encounters } = adventure;
    const nodes = getAdventureNodes(adventure.id);

    return (
        <div className="map-container">
            {/* Background image defines the container scale */}
            <div className="map-bg-pattern">
                {mapImage && (
                    <img
                        src={mapImage}
                        alt="Map Background"
                        className="map-bg-image"
                        ref={mapImageRef}
                    />
                )}
            </div>

            <div className="map-center-col">
                <div className="map-col-inner">
                    <MapPathSVG encounters={encounters} referenceHeight={referenceHeight} />

                    {nodes.map((node, index) => (
                        <MapNode
                            key={node.id}
                            node={node}
                            index={index}
                            currentNode={currentNode}
                            adventureId={adventure.id}
                            onNodeClick={onNodeClick}
                            nodeRef={(index + 1) === currentNode ? currentNodeRef : null}
                            referenceHeight={referenceHeight}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
