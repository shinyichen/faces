# coding: utf-8
import sys
import os
import numpy as np
from pprint import pprint

#input:
#1- h-dimension feature vector
#2- image id
#3- clusters
#output: [[img, confidence], …]

if __name__ == "__main__":
    features_path = sys.argv[1]
    ids_path = sys.argv[2] # id for features
    clusters_path = sys.argv[3]
    output_path = sys.argv[4]

    # features
    features = np.loadtxt(features_path, delimiter=',')
    feature_count = len(features[0])

    # ids
    ids = np.loadtxt(ids_path, dtype='string')
    #pprint(ids)

    id2feature = dict(zip(ids, features))

    # clusters
    clusters = np.genfromtxt(clusters_path, delimiter=',', dtype=None, names=['template_id','filename','cluster', 'confidence'])
    clusters = np.delete(clusters, 0) # remove header row
    #pprint(clusters)

    # cluster ids
    cids = np.unique(clusters[:]['cluster'])
    #pprint(cids)

    # for each cluster, calculate average feature vector
    average_vectors = dict() # id: vector
    cluster_images = dict() # cid : images
    for cid in cids:
        cluster = clusters[clusters[:]['cluster'] == cid] # rows with this cluster id
        #pprint(cluster)
        c_image_count = len(cluster)
        c_images = cluster[:]['filename'] # list image filenames of this cluster
        cluster_images[cid] = c_images
        #pprint(c_images)
        f_sum = []
        for i in range(feature_count):
            f_sum.append(0);
        for image in c_images :
            # remove file extension
            image = os.path.splitext(image)[0]
            f = id2feature[image]
            for i in range(feature_count):
                f_sum[i] = f_sum[i] + f[i]
        average_vec = []
        for i in range(feature_count):
            average_vec.append(f_sum[i]/c_image_count)
        average_vectors[cid] = average_vec
    #pprint(average_vectors)

    # for each image, calculate distance from its average vector
    confidence = []
    for cid, a_vector in average_vectors.items():
        c_images = cluster_images[cid]
        for image in c_images:
            # remove file extension
            image_name = os.path.splitext(image)[0]
            i_vector = id2feature[image_name] # image vector
            coeff = np.corrcoef(i_vector, a_vector)[0,1]
            confidence.append([image, coeff])
    #pprint(confidence)
    np.savetxt(output_path, confidence, delimiter=',', fmt=('%s'))
