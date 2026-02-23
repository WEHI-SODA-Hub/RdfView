import { Button, Flex, Text } from "@radix-ui/themes";
import React, { useRef, useState } from "react";
import { ContentType } from "rdflib/lib/types";
import { RdfSource } from "./RdfViewer";
import { EXTENSION_TO_CONTENT_TYPE } from "../rdfLibUtils";

export type RdfUploadProps = {
    onUpload: (source: RdfSource) => void;
}

export const RdfUpload: React.FC<RdfUploadProps> = ({ onUpload }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pendingSource, setPendingSource] = useState<{ file: File; source: RdfSource } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        const contentType: ContentType = EXTENSION_TO_CONTENT_TYPE[ext] ?? "text/turtle";

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content != null) {
                setPendingSource({ file, source: { content, contentType } });
            }
        };
        reader.readAsText(file);
    };

    const handleUpload = () => {
        if (!pendingSource) return;
        onUpload(pendingSource.source);
        setPendingSource(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleClear = () => {
        setPendingSource(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <Flex align="center" gap="2">
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
                Choose file
            </Button>
            <input
                ref={inputRef}
                type="file"
                accept={Object.keys(EXTENSION_TO_CONTENT_TYPE).join(",")}
                onChange={handleFileChange}
                style={{ display: "none" }}
            />
            {pendingSource ? (
                <>
                    <Text size="2" color="gray">{pendingSource.file.name}</Text>
                    <Button onClick={handleUpload}>Upload</Button>
                    <Button variant="ghost" color="gray" onClick={handleClear}>Clear</Button>
                </>
            ) : (
                <Text size="2" color="gray">No file selected</Text>
            )}
        </Flex>
    );
}
