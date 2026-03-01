import React from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatedStoryText } from './AnimatedStoryText';

interface ChapterStoryProps {
    adventureId: string;
    adventureStoryHook?: string;
    isLocked: boolean | undefined;
    isRevealing?: boolean;
    onCompleteReveal?: () => void;
}

export const ChapterStory: React.FC<ChapterStoryProps> = ({
    adventureId,
    adventureStoryHook,
    isLocked,
    isRevealing = false,
    onCompleteReveal = () => { }
}) => {
    const { t } = useTranslation();

    const textToDisplay = isLocked
        ? t('chronicle.mystery_path')
        : t(`adventures.${adventureId}.story_hook`, adventureStoryHook || '');

    return (
        <div className="chapter-details" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="story-scroll-container">
                <p className="story-hook">
                    <AnimatedStoryText
                        text={textToDisplay}
                        isSkipped={!isRevealing || !!isLocked}
                        onComplete={onCompleteReveal}
                    />
                </p>
            </div>
        </div>
    );
};
