import React, { useState } from 'react';
import type { Adventure } from '../../../types/adventure.types';
import { AdventureStatus } from '../../../types/adventure.types';
import { getAdventureIllustration } from '../../../data/adventure-assets';
import { ChapterHeader } from './ChapterHeader';
import { ChapterIllustration } from './ChapterIllustration';
import { ChapterStory } from './ChapterStory';
import { ChapterActions } from './ChapterActions';
import { useVoiceOver } from '../../../hooks/useVoiceOver';
import './ChapterPage.css';

interface ChapterPageProps {
    adventure: Adventure;
    status: AdventureStatus;
    stars: number;
    onBegin: (id: string) => void;
    onReplay: (id: string) => void;
    onNext: () => void;
    onPrev: () => void;
    canNext: boolean;
    canPrev: boolean;
    currentPage: number;
    totalPages: number;
    isJustCompleted?: boolean;
    isPremiumLocked?: boolean;
    hasProgress: boolean;
    isActive: boolean;
}

export const ChapterPage: React.FC<ChapterPageProps> = ({
    adventure,
    status,
    stars,
    onBegin,
    onReplay,
    onNext,
    onPrev,
    canNext,
    canPrev,

    currentPage,
    totalPages,
    isJustCompleted,
    isPremiumLocked,
    hasProgress,
    isActive
}) => {
    const isProgressionLocked = status === AdventureStatus.LOCKED;
    const isLocked = isProgressionLocked || isPremiumLocked;
    const isCompleted = status === AdventureStatus.COMPLETED;
    const illustration = getAdventureIllustration(adventure.id);

    useVoiceOver('chronicles', isActive && !isLocked ? `adventure-${adventure.id}` : '');

    const [lastFlags, setLastFlags] = useState({ id: adventure.id, active: isActive, locked: isLocked });
    const [isRevealing, setIsRevealing] = useState(isActive && !isLocked);

    if (adventure.id !== lastFlags.id || isActive !== lastFlags.active || isLocked !== lastFlags.locked) {
        setLastFlags({ id: adventure.id, active: isActive, locked: isLocked });
        setIsRevealing(isActive && !isLocked);
    }

    return (
        <div className={`chapter-page ${isLocked ? 'locked' : ''}`} data-testid="chapter-page">
            <ChapterHeader
                adventureId={adventure.id}
                adventureTitle={adventure.title}
            />

            <div className="chapter-content">
                <ChapterIllustration
                    illustration={illustration}
                    adventureTitle={adventure.title || ''}
                    isLocked={isLocked}
                    stars={stars}
                    isCompleted={isCompleted}
                    isJustCompleted={isJustCompleted}
                />

                <ChapterStory
                    adventureId={adventure.id}
                    adventureStoryHook={adventure.storyHook}
                    isLocked={isLocked}
                    isRevealing={isRevealing}
                    onCompleteReveal={() => setIsRevealing(false)}
                />
            </div>

            <ChapterActions
                adventureId={adventure.id}
                onBegin={onBegin}
                onReplay={onReplay}
                onNext={onNext}
                onPrev={onPrev}
                canNext={canNext}
                canPrev={canPrev}
                isLocked={isLocked}
                isPremiumLocked={isPremiumLocked}
                isProgressionLocked={isProgressionLocked}
                isCompleted={isCompleted}
                isJustCompleted={isJustCompleted}
                currentPage={currentPage}
                totalPages={totalPages}
                hasProgress={hasProgress}
            />
        </div>
    );
};
