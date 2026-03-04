import { Button, Flex, Text } from "@radix-ui/themes";
import React, { useRef, useState } from "react";
import { ContentType } from "rdflib/lib/types";
import { RdfSource } from "./RdfViewer";
import { EXTENSION_TO_CONTENT_TYPE } from "../rdfLibUtils";

export type RdfUploadProps = {
    onUpload: (source: RdfSource) => void;
}

/**
 * Component for uploading RDF files. It reads the file content and calls onUpload with the content and content type. 
 */
export const RdfUpload: React.FC<RdfUploadProps> = ({ onUpload }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        const contentType: ContentType = EXTENSION_TO_CONTENT_TYPE[ext] ?? "text/turtle";

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content != null) {
                onUpload({ content, contentType });
            }
        };
        reader.readAsText(file);
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
        </Flex>
    );
}
