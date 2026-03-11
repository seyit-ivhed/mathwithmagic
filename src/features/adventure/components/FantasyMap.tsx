import { useRef, useLayoutEffect, useCallback } from 'react';
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
    const endNodeRef = useRef<HTMLDivElement>(null);
    const mapImageRef = useRef<HTMLImageElement>(null);
    const hasAnimatedRef = useRef(false);

    // Reference height based on original design (where nodes were placed)
    // Looking at current data, nodes go up to y: 3900.
    // The previous min-height was 4500px.
    const referenceHeight = 4500;

    const mapImage = getAdventureMapImage(adventure.id);

    const { getAdventureNodes } = useGameStore();

    const lastNodeIndex = adventure.encounters.length;

    const startScrollAnimation = useCallback(() => {
        if (!endNodeRef.current) return;

        // Instantly scroll to the end (last) node
        endNodeRef.current.scrollIntoView({
            behavior: 'instant',
            block: 'center'
        });

        // After a brief pause, smooth scroll to the current/focal node
        setTimeout(() => {
            currentNodeRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 400);
    }, []);

    useLayoutEffect(() => {
        if (!hasAnimatedRef.current) {
            // Wait for the map image to load so the container has its full height
            const img = mapImageRef.current;
            if (img?.complete) {
                hasAnimatedRef.current = true;
                startScrollAnimation();
            } else if (img) {
                const onLoad = () => {
                    if (!hasAnimatedRef.current) {
                        hasAnimatedRef.current = true;
                        startScrollAnimation();
                    }
                };
                img.addEventListener('load', onLoad);
                return () => img.removeEventListener('load', onLoad);
            }
            return;
        }

        // On subsequent currentNode changes (e.g. navigating back), scroll directly
        currentNodeRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }, [currentNode, lastNodeIndex, startScrollAnimation]);

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

                    {nodes.map((node, index) => {
                        const nodeStep = index + 1;
                        const isCurrentNode = nodeStep === currentNode;
                        const isEndNode = nodeStep === lastNodeIndex;

                        let ref = null;
                        if (isCurrentNode) ref = currentNodeRef;
                        else if (isEndNode) ref = endNodeRef;

                        return (
                            <MapNode
                                key={node.id}
                                node={node}
                                index={index}
                                currentNode={currentNode}
                                adventureId={adventure.id}
                                onNodeClick={onNodeClick}
                                nodeRef={ref}
                                referenceHeight={referenceHeight}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
